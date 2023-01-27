---
layout: project
git: https://github.com/CrissNamon/progressive
maven: https://central.sonatype.dev/artifact/tech.hiddenproject/progressive/0.6.1/overview
package: tech.hiddenproject:progressive
title: Progressive
custom: progressive
---

# Progressive

<p>Progressive is a simple game framework, which provides you predefined way to develop your game logic.</p>

#### About project
___
Progressive gives you an IoC/DI container with auto injections feature through annotations, game objects, game scripts and much more! It's is like a constructor. You can add game objects and attach game scripts to them.

Main features:

- IoC/DI container for auto dependency injections, packages scanning and synchronized work of all components
- Predefined way to game development: create game objects and attach some scripts to them
- State machine allows you to change game lifecycle, or control any other object states with transitions through events, actions and guards
- Global publisher - the way your components can "talk" to each other
- Component creator will help you to create some components with just one method call
- Many useful annotations to reduce boilerplate code

#### Use

##### Maven

```xml
<dependency>
    <groupId>tech.hiddenproject</groupId>
  <artifactId>progressive</artifactId>
  <version>0.6.1</version>
</dependency>
```

##### Gradle

````groovy
implementation 'tech.hiddenproject:progressive:0.6.1'
````

#### Resources
___
* Learn more at Progressive [Wiki](https://github.com/CrissNamon/progressive/wiki)
* Look at some examples in [example](https://github.com/CrissNamon/progressive/blob/main/src/main/java/ru/hiddenproject/example/) package
* See javadoc [here](https://crissnamon.github.io/progressive/)

#### Dependencies and source 
___

[BasicProxyCreator](https://github.com/CrissNamon/progressive/blob/main/src/main/java/ru/hiddenproject/progressive/basic/BasicProxyCreator.java) uses [ByteBuddy](https://bytebuddy.net/) for proxy creation. You need to add byte-buddy lib to be able to use proxy classes in your project. For android development you also need to add [byte-buddy-android](https://github.com/raphw/byte-buddy/tree/master/byte-buddy-android) lib.
<p>All other parts of Progressive have no dependencies and use only Java 8.</p> 

#### Additional info
___
Progressive is released under version 2.0 of the [Apache License](https://www.apache.org/licenses/LICENSE-2.0)

#### Authors
___
* [Danila Rassokhin](https://gihub.com/crissnamon) [![Twitter](https://img.shields.io/twitter/follow/kpekepsalt?style=social)](https://twitter.com/kpekepsalt_en)
