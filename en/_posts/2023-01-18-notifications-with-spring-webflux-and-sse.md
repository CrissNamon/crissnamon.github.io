---
layout: post
title:  "Notifications with Spring Boot and SSE"
lang: en
lang-ref: notifications-with-spring-webflux-and-sse
date: 2023-01-18 20:00
---

Sometimes it may be necessary to send real-time data to the user, such as notifications in the Frontend application. To do this, you can use the following simple method using Flux from Project Reactor and ServerSentEvents from Spring.

First you need to create a class to store the notification. For simplicity, it will have only two fields: id and message.

```java
public class Notification {

  private final Integer id;
  private final String message;

  public Notification(Integer id, String message) {
    this.id = id;
    this.message = message;
  }

  public Integer getId() {
    return id;
  }
}
```

Next, we will create a service that will manage subscriptions and notifications. We will determine who owns the notification by the user id. We will generate a random id for each notification. Let's limit our Random to the interval [0, 3].
```java
private Integer generateId() {
	return RANDOM.nextInt(4);
}
```

Instead of real data, we will generate simple notifications every 2 seconds.

```java
private ServerSentEvent<Notification> generateNotification() {
    return ServerSentEvent.<Notification>builder()
        .data(new Notification(generateId(), "Notification"))
        .build();
}

private void generateNotifications(FluxSink<ServerSentEvent<Notification>> sink) {
    Flux.interval(Duration.ofSeconds(2)) // Generate simple notifications every 2 seconds.
        .map(i -> generateNotification())
        .doOnNext(serverSentEvent -> {
          sink.next(serverSentEvent); // Sending notifications to the global Flux via its FluxSink
          log.info("Sent for {}", serverSentEvent.data().getId());
        })
        .doFinally(signalType -> log.info("Notification flux closed")) // Logging the closure of our generator
        .takeWhile(notification -> !sink.isCancelled()) // We generate messages until the global Flux is closed
        .subscribe();
}
```

If we start sending notifications immediately from the generator, we may encounter a timeout problem and a disconnection. Currently, notifications are created every 2 seconds, but in a real system, notifications can be created in minutes or even hours. If no data is sent to an open connection for a certain time (usually a couple of minutes), it will automatically close. To avoid this, let's create a heartbeat - an extra stream of empty comments that will be sent to the open connection to keep it open. Spring itself will take care of closing it and close our heartbeat automatically.

```java
private <T> Flux keepAlive(Duration duration, Flux<T> data, Integer id) {
    Flux<ServerSentEvent<T>> heartBeat = Flux.interval(duration) // Создаем Flux с определенным интервалом
        .map(
            e -> ServerSentEvent.<T>builder() /Create a new SSE object with a comment and an empty body
                .comment("keep alive for: " + id)
                .build()
        )
        .doFinally(signalType -> log.info("Heartbeat closed for id: {}", id));
    return Flux.merge(heartBeat, data);
}
```

Now let's write a simple method for subscribing to notifications by id.
```java
public Flux<ServerSentEvent<Notification>> subscribe(int id) {
    return keepAlive(Duration.ofSeconds(3),
                     notificationFlux.filter(notification -> notification.data() == null || 
                         notification.data().getId() == id),
                     id);
}
```

Let's create a global Flux in the service constructor.
```java
private final Flux<ServerSentEvent<Notification>> notificationFlux;

public NotificationService() {
    notificationFlux = Flux.push(this::generateNotifications);
}
```

Now let's create a RestController and a simple endpoint for subscribing to notifications.
```java
@RestController
public class NotificationController {

  private final NotificationService notificationService;

  @Autowired
  public NotificationController(NotificationService notificationService) {
    this.notificationService = notificationService;
  }

  @GetMapping("/subscribe/{id}")
  public Flux<ServerSentEvent<Notification>> subscribe(@PathVariable Integer id) {
    return notificationService.subscribe(id);
  }
}
```

If you open http://localhost:8080/subscribe/1 in a browser, you will get the following output. Now you can stop loading the page or close it.
```
:keep alive for: 1

:keep alive for: 1

data:{"id":1,"message":"Notification"}

:keep alive for: 1

:keep alive for: 1

data:{"id":1,"message":"Notification"}
```

The output in the console, of course, will be different due to random id. I got this one:
```
Sent for 3
Sent for 3
Sent for 1
Sent for 0
Sent for 3
Sent for 2
Sent for 1
Heartbeat closed for id: 1
Sent for 3
Notification flux closed
```

You can receive notifications on the Frontend application using the built-in JavaScript tools or using third-party libraries. I use [sse.js](https://github.com/mpetazzoni/sse.js)