---
layout: post
title:  "Develop your own Retrofit with Proxy | Java Reflection (Part 1)"
lang: en
lang-ref: java-reflection-proxy
date: 2023-01-22 08:00
---

In this tutorial you will learn how to use Proxy from java.lang.reflect package on example of building http client based on interfaces similar to Retrofit.
<!--more-->

For you to understand the end result, I will show an example of the result.

Will create some interface to store our requests in one place:
```java
public interface BookClient {

  // Get request to SOME_BASE_URL/book
  @GET("/book")
  List<Book> getBooks();

}
```
Then we will just create an instance of this interface with our special creator class:

```java
BookClient bookClient = WebClient.of(BookClient.class)
        .baseUrl("https://63c306edb0c286fbe5f7e9d4.mockapi.io/api/v1")
        .create();

List<Book> books = bookClient.getBooks();

System.out.println(books);
```
The output of this code will be:
```bash
[Book{id=1, title='Sherry Waelchi'}, Book{id=3, title='Mr. Nathan Labadie'}, ...]
```
And so how does it work under the hood?


![java_reflection.png](:/129e01f4e512460eac52b4399f3d680f)


When we call WebClient.of(BookClient.class) it uses Proxy class to create proxy object of our interface, which will be returned as a result. All method calls to our proxy object will be proxied to our InvocationHandler implementation which will collect information from annotations and send request using standard HttpClient. Response will be parsed from JSON using Gson library and then returned as a result of called method.

So, let’s write some code!

Firstly we will create simple annotation to specify request method and resource url:

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface GET {

  String value();

}
```
We also need some Enum of available Http methods:

```java
public enum RequestMethod {

  GET

}
```
Now we need some AnnotationProcessor to find our annotations:

```java
public class AnnotationProcessor {

  /**
   * This method will get all annotations from given
   * method and find annotation with given type
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
To build request let’s create RequestCreator class with one static method:

```java
public class RequestCreator {

  /**
   * Create request with given baseUrl + path and requestMethod
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
   * Create base request with base url and Http version
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
To catch method calls to our proxy we need implementation of InvocationHandler interface, so let’s create RequestMethodHandler:

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
    
    // Get annotation from intercepted method
    GET get = AnnotationProcessor.extractMethodAnnotation(method, GET.class);
    String url = get.value();
    
    // Create reqeust
    HttpRequest request = RequestCreator.create(baseUrl, url, RequestMethod.GET);

    return sendRequest(request, method);
  }

  /**
   * Will make request using HttpClient and parse JSON response with Gson
  **/
  private Object sendRequest(HttpRequest httpRequest, Method method) {
    try {
      HttpResponse<String> httpResponse = httpClient.send(httpRequest, BodyHandlers.ofString());
      // method.getGenericReturnType() is important 
      // to get method return type with generic class
      // For example, if method return type is List<Book>, then it will return exactly this type,
      // but method.getReturnType() will only return List.class
      return new Gson().fromJson(httpResponse.body(), method.getGenericReturnType());
    } catch (JsonSyntaxException | IOException | InterruptedException e) {
      throw new RuntimeException(e);
    }
  }
}
```
Finally we can create WebClient class to create our proxy objects:

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
In `T create()` method we call static `Proxy.newProxyInstance method` to create proxy object. It accepts 3 arguments:

- Class loader (we use ClassLoader from given interface)
- Array of interfaces our proxy object will implement (here you can specify different interfaces, but we need only one. It is important to say, that values of this array must be only interfaces and not classes or enums!)
- Our InvocationHandler instance

And now we can create some client and test it on mock API. That’s all.

It is just a basic example, but you can add more request methods, path params and much more. See my version of client with all useful features on GitHub: [https://github.com/CrissNamon/http-interface-client](https://github.com/CrissNamon/http-interface-client)