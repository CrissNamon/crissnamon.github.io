---
layout: post
title:  "Уведомления со Spring WebFlux и SSE"
lang: ru
lang-ref: notifications-with-spring-webflux-and-sse
date: 2023-01-17 20:00
---

Иногда может возникнуть необходимость отправлять пользователю данные в реальном времени, например уведомления на Frontend приложении. Для этого можно использовать следующий простой способ с использованием Flux из Project Reactor и ServerSentEvents из Spring.

Для начала необходимо создать класс для хранения уведомления. Для простоты у него будут только два поля: id и message.

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

Далее создадим сервис, который будет управлять подписками и уведомлениями. Определять, кому принадлежит уведомление будем по id пользователя. Будем генерировать случайный id для каждого уведомления. Ограничим наш Random в промежутке [0, 3].
```java
private Integer generateId() {
	return RANDOM.nextInt(4);
}
```

Вместо реальных данных будем генерировать простые уведомления раз в 2 секунды.  

```java
private ServerSentEvent<Notification> generateNotification() {
    return ServerSentEvent.<Notification>builder()
        .data(new Notification(generateId(), "Notification"))
        .build();
}

private void generateNotifications(FluxSink<ServerSentEvent<Notification>> sink) {
    Flux.interval(Duration.ofSeconds(2)) // Создаем уведомления каждые 2 секунды
        .map(i -> generateNotification())
        .doOnNext(serverSentEvent -> {
          sink.next(serverSentEvent); // Отправляем уведомления в глобальный Flux через его FluxSink
          log.info("Sent for {}", serverSentEvent.data().getId());
        })
        .doFinally(signalType -> log.info("Notification flux closed")) // Логируем закрытие нашего генератора
        .takeWhile(notification -> !sink.isCancelled()) // Генерируем сообщения пока не закрыт глобальный Flux
        .subscribe();
}
```

Если мы начнем отправлять уведомления сразу из генератора, то можем столкнуться с проблемой таймаута и разрывом соединения. Сейчас уведомления создаются раз в 2 секунды, но в реальной системе уведомления могут создаваться минуты и даже часы. Если в течение определенного времени (обычно пары минут) в открытое соединение не будет отправлено никаких данных, то оно автоматически закроется. Чтобы избежать этого, создадим heartbeat - дополнительный поток из пустых комментариев, которые будут отправляться в открытое соединения, чтобы поддерживать его открытым. О его закрытии позаботится сам Spring и закроет наш heartbeat автоматически.

```java
private <T> Flux keepAlive(Duration duration, Flux<T> data, Integer id) {
    Flux<ServerSentEvent<T>> heartBeat = Flux.interval(duration) // Создаем Flux с определенным интервалом
        .map(
            e -> ServerSentEvent.<T>builder() // Создаем новый объект SSE с комментарием и пустым телом
                .comment("keep alive for: " + id)
                .build()
        )
        .doFinally(signalType -> log.info("Heartbeat closed for id: {}", id));
    return Flux.merge(heartBeat, data);
}
```

Теперь напишем простой метод для подписки на на уведомления по из id.
```java
public Flux<ServerSentEvent<Notification>> subscribe(int id) {
    return keepAlive(Duration.ofSeconds(3),
                     notificationFlux.filter(notification -> notification.data() == null || 
                         notification.data().getId() == id),
                     id);
}
```

В конструкторе сервиса создадим глобальный Flux.
```java
private final Flux<ServerSentEvent<Notification>> notificationFlux;

public NotificationService() {
    notificationFlux = Flux.push(this::generateNotifications);
}
```

Теперь создадим RestController и простой endpoint для подписки на уведомления.
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

Если открыть в браузере http://localhost:8080/subscribe/1 можно получить следующий вывод. Теперь можно остановить загрузку страницы или закрыть ее. 
```
:keep alive for: 1

:keep alive for: 1

data:{"id":1,"message":"Notification"}

:keep alive for: 1

:keep alive for: 1

data:{"id":1,"message":"Notification"}
```

Вывод в консоли, конечно из-за случайных id будет разный. Я получил такой:
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

Получать уведомления на Frontend приложении можно с помощью встроенных средств JavaScript или с помощью сторонних библиотек. Я использую [sse.js](https://github.com/mpetazzoni/sse.js)