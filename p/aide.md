---
layout: project
git: https://github.com/CrissNamon/aide
maven: https://central.sonatype.dev/artifact/tech.hiddenproject/aide/1.1/overview
package: tech.hiddenproject:aide
title: Aide
custom: aide
---

## About

Aide is a set of useful utils for fast reflection, extended optionals and conditionals. It can help you with development of some service or your own framework.

## Content

#### Reflection

Aide reflection contains utils for reflection such as fast method invocation with lambda wrapping, annotation processing and other useful methods.

Reflective method calls with Aide are simple:

```java
// Get LambdaWrapperHolder isntance with default LambdaWrapper interface loaded
LambdaWrapperHolder lambdaWrapperHolder = LambdaWrapperHolder.DEFAULT;
// Find static method
Method staticMethod = ReflectionUtil.getMethod(TestClass.class, "staticMethod", String.class);
// Wrap static method
// LambdaWrapper - default wrapper interface from Aide
// Test class - caller class
// Integer - return type
MethodHolder<LambdaWrapper, TestClass, Integer> staticHolder = lambdaWrapperHolder.wrapSafe(staticMethod);
// Invoke static method without caller
int staticResult = staticHolder.invokeStatic("Hello");
```

#### Optional

Aide optional contains extended optional classes for String, Boolean types, IfTrue and When conditionals, Object utils.

Extended optionals provides new methods for some types:

```java
BooleanOptional.of(Modifier.isPublic(executable.getModifiers()))
        .ifFalseThrow(() -> ReflectionException.format("Wrapping is supported for PUBLIC methods only!"));
```

With conditionals you can make your code more functional. Thats how Aide reflection uses them:

```java
AbstractSignature signature = IfTrueConditional.create()
        .ifTrue(exact).then(() -> ExactMethodSignature.from(method))
        .orElseGet(() -> MethodSignature.from(method));
```

Or WhenConditional:

```java
WhenConditional.create()
    .when(someObj, Objects::nonNull).then(MyClass::nonNull)
    .when(someObj, Objects::isNull).then(MyClass::isNull)
    .orDoNothing();
```

## Use

Artifact ids:

- all -> aide-all
- reflection -> aide-reflection
- optional -> aide-optional

### Maven

```xml
<dependency>
  <groupId>tech.hiddenproject</groupId>
  <artifactId>aide-all</artifactId>
  <version>1.1</version>
</dependency>
```

### Gradle

```groovy
implementation 'tech:hiddenproject:aide-all:1.1'
```

## Resources

___

* Learn more at Aide [Wiki](https://github.com/CrissNamon/aide/wiki)
* Look at some examples
  in [example](https://github.com/CrissNamon/aide/tree/main/aide-all/src/main/java/tech/hiddenproject/aide/example)
  package

## Dependencies and source

___

Aide has no dependencies and use only Java 8.</p>

## Repository info

___

* The main branch contains stable release
* Development branch contains WIP code
* Aide is released under version 2.0 of the [Apache License](https://www.apache.org/licenses/LICENSE-2.0)

## Authors

___

* [Danila Rassokhin](https://gihub.com/crissnamon) [![Twitter](https://img.shields.io/twitter/follow/kpekepsalt_en?style=social)](https://twitter.com/kpekepsalt_en)