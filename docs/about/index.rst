==============================
About the Lino React front end
==============================

The "modern" React front end is an alternative to the "classical" ExtJS front
end. Here are two screenshots of a same Lino site, one with ExtJS and one with
React:

.. image:: noi-robin-extjs.png
  :width: 48%

.. image:: noi-robin-react.png
  :width: 48%



How to try it:

- Install some Lino application as explained in :ref:`lino.dev.install`.

- Run ``pip install lino-react``.

- In your :xfile:`settings.py` file, set the :attr:`default_ui
  <lino.core.site.Site.default_ui>` attribute to :mod:`lino_react.react`::

    class Site(Site):
        ...
        default_ui = 'lino_react.react'
        ...

- Start the development server::

    $ python manage.py runserver
