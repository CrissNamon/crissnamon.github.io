---
lang: en
---
# Blog
{% assign posts = site.posts | where:"lang", page.lang %}
  {% for post in posts %}
### [{{ post.title }}]({{ post.url }})
#### {{ post.date }}
___
{{ post.excerpt }}
[Read >>>]({{ post.url }})
<br>
  {% endfor %}