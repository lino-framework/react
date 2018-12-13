.. doctest docs/specs/linoweb.rst
.. _specs.linoweb:

=======
linoweb
=======

>>> import lino
>>> lino.startup('lino_react.projects.teamReact.settings.demo')
>>> from lino.api.doctest import *
>>> from pprint import pprint

>>> from django.contrib.staticfiles import finders
>>> from django.contrib.staticfiles.storage import staticfiles_storage

Define a utility function:

>>> def soupyfiy(url, Print=False):
...     r = test_client.get(url)
...     soup = BeautifulSoup(r.content, "lxml")
...     soup.body.hidden=True
...     if Print:
...         pSoup(soup)
...     return r,soup
>>> def pSoup(soup):
...     print(soup.body.prettify(formatter=None))
>>> test_client.force_login(rt.login('robin').user)
>>> rt.settings.SITE.kernel.default_renderer.build_site_cache(True)
... #doctest: +ELLIPSIS +REPORT_UDIFF +SKIP
2... lino*.js files have been built in ...


For some reason django test client doesn't find static files.

>>> test_client.get("/media/cache/js/lino_900_en.js")
Not Found: /media/cache/js/lino_900_en.js
<HttpResponseNotFound status_code=404, "text/html">
