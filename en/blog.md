# Blog
<ul>
  {% for post in site.posts  | where:"lang", page.lang %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
    </li>
  {% endfor %}
</ul>