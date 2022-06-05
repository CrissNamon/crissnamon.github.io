---
lang:  en
---
### Hi! My site is available in different languages.
### Привет! Мой сайт доступен на разных языках.
<ul class="languages">
{% for lang in site.data.languages %}
{% assign language = lang[1] %}
<li><a href="{{site.baseurl}}{{lang[0]}}">{{language.icon}} {{ language.label }}</a></li>
{% endfor %}
</ul>