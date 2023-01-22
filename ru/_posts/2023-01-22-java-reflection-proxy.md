---
layout: post
title:  "Делаем свой аналог http клиента Retrofit с помощью Proxy | Java Reflection (Часть 1)"
lang: ru
lang-ref: java-reflection-proxy
date: 2023-01-22 08:00
---

В этой статье я расскажу как использовать `Proxy` из пакета `java.lang.reflect` на примере создания http-клиента на основе интерфейсов, аналогичного Retrofit.
<!--more-->

Чтобы вы поняли конечный результат, я покажу пример.

Создадим некоторый интерфейс для хранения наших запросов в одном месте:
```java
public interface BookClient {

  // Get request to SOME_BASE_URL/book
  @GET("/book")
  List<Book> getBooks();

}
```
Затем мы просто создадим экземпляр этого интерфейса с нашим специальным классом-создателем:

```java
BookClient bookClient = WebClient.of(BookClient.class)
        .baseUrl("https://63c306edb0c286fbe5f7e9d4.mockapi.io/api/v1")
        .create();

List<Book> books = bookClient.getBooks();

System.out.println(books);
```
Вывод будет таким:
```bash
[Book{id=1, title='Sherry Waelchi'}, Book{id=3, title='Mr. Nathan Labadie'}, ...]
```
Как это работает?

![java_reflection.png](https://crissnamon.github.io/assets/img/posts/java-reflection-proxy.png)


Когда мы вызываем `WebClient.of(BookClient.class)`, он использует `Proxy` для создания прокси-объекта нашего интерфейса, который будет возвращен в результате. Все вызовы методов нашего прокси-объекта будут проксированы к нашей реализации `InvocationHandler`, которая будет собирать информацию из аннотаций и отправлять запрос с использованием стандартного `HttpClient`. Ответ из JSON будем парсить с использованием библиотеки Gson, а затем возвращать как результат вызванного метода.

Переходим к коду!

Сначала мы создадим простую аннотацию, чтобы указать метод запроса и URL-адрес ресурса:

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface GET {

  String value();

}
```
Нам также нужно некоторое перечисление доступных методов Http:

```java
public enum RequestMethod {

  GET

}
```
Теперь нам нужен AnnotationProcessor, чтобы найти наши аннотации:

```java
public class AnnotationProcessor {

  /**
   * Этот метод получит все аннотации из данного 
   * метода и найдет аннотацию с заданным типом
  **/
  public static <T extends Annotation> T extractMethodAnnotation(Method method,
                                                                 Class<T> annotationClasses) {
    return Arrays.stream(method.getDeclaredAnnotations())
        .filter(annotation -> annotation.annotationType().equals(annotationClasses))
        .map(annotation -> (T) annotation)
        .findFirst().orElse(null);
  }

}
```
Для построения запроса создадим класс `RequestCreator` с одним статическим методом.:

```java
public class RequestCreator {

  /**
   * Создать запрос на baseUrl + path методом requestMethod
  **/
  public static HttpRequest create(String baseUrl, String path,
                                   RequestMethod requestMethod) {
    HttpRequest.Builder baseRequest = baseRequest(baseUrl + path);
    switch (requestMethod) {
      case GET:
        baseRequest = baseRequest.GET();
        break;
      default:
        throw new RuntimeException("Method " + requestMethod + " is not supported");
    }
    return baseRequest.build();
  }

  /**
   * Создает базовый запрос с base url и версией Http.
  **/
  private static HttpRequest.Builder baseRequest(String url) {
    try {
      return HttpRequest.newBuilder()
          .uri(new URI(url))
          .version(HttpClient.Version.HTTP_2);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

}
```
Чтобы перехватывать вызовы методов нашего прокси-объекта, нам нужна реализация интерфейса `InvocationHandler`, поэтому давайте создадим `RequestMethodHandler`:

```java
public class RequestMethodHandler implements InvocationHandler {

  private final HttpClient httpClient;

  private final String baseUrl;

  public RequestMethodHandler(HttpClient httpClient, String baseUrl) {
    this.httpClient = httpClient;
    this.baseUrl = baseUrl;
  }

  @Override
  public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
    
    // Получить аннотацию с проксированного метода
    GET get = AnnotationProcessor.extractMethodAnnotation(method, GET.class);
    String url = get.value();
    
    // Создать запрос
    HttpRequest request = RequestCreator.create(baseUrl, url, RequestMethod.GET);

    return sendRequest(request, method);
  }

  /**
   * Отправит запрос с использованием HttpClient и распарсит JSON-ответ через Gson
  **/
  private Object sendRequest(HttpRequest httpRequest, Method method) {
    try {
      HttpResponse<String> httpResponse = httpClient.send(httpRequest, BodyHandlers.ofString());
      // Важно: method.getGenericReturnType() 
      // вернет тип возвращаемого значения метода вместе с дженериками
      // Например, если возвращаемый тип - List<Book>, тогда мы молучи именно этот тип,
      // но method.getReturnType() вернет только List.class
      return new Gson().fromJson(httpResponse.body(), method.getGenericReturnType());
    } catch (JsonSyntaxException | IOException | InterruptedException e) {
      throw new RuntimeException(e);
    }
  }
}
```
Наконец, мы можем создать класс WebClient для создания наших прокси-объектов:

```java
public class WebClient<T> {

  private final Class<T> clientClass;

  private String baseUrl;

  private HttpClient httpClient = HttpClient.newBuilder().build();

  private WebClient(Class<T> clientClass) {
    this.clientClass = clientClass;
  }

  public static <T> WebClient<T> of(Class<T> clientClass) {
    return new WebClient<>(clientClass);
  }

  public WebClient<T> baseUrl(String baseUrl) {
    this.baseUrl = baseUrl;
    return this;
  }

  @SuppressWarnings("unchecked")
  public T create() {
    return (T) Proxy.newProxyInstance(clientClass.getClassLoader(), new Class[]{clientClass},
                                      getDefaultHandler()
    );
  }

  private InvocationHandler getDefaultHandler() {
    return new RequestMethodHandler(httpClient, baseUrl);
  }

}
```
В методе `T create()` мы вызываем статический метод `Proxy.newProxyInstance` для создания прокси-объекта. Он принимает 3 аргумента:

- Загрузчик классов (используем ClassLoader из данного интерфейса)
- Массив интерфейсов, которые будет реализовывать наш прокси-объект (здесь вы можете указать разные интерфейсы, но нам нужен только один. Важно отметить, что значения этого массива должны быть только интерфейсами, а не классами или перечислениями!)
- Наш экземпляр `InvocationHandler`

И теперь мы можем создать какой-нибудь клиент и протестировать его на mock API. Вот и все.

Это всего лишь базовый пример, но вы можете добавить дополнительные методы запроса, параметры пути и многое другое. Смотрите мою версию клиента со всеми полезными функциями на GitHub: [https://github.com/CrissNamon/http-interface-client](https://github.com/CrissNamon/http-interface-client)