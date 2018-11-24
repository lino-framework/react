.. _react:

========================
React interface for Lino
========================

This is the documentation tree for :mod:`lino_react`.


.. py2rst::

  from lino_react import SETUP_INFO
  print(SETUP_INFO['long_description'])


How to try it:

- Install some Lino application as explained in :ref:`lino.dev.install`.

- In your local :class:`Site <lino.core.site.Site>` class (defined in
  your :xfile:`settings.py` file), set set the :attr:`default_ui`
  attribute to :mod:`lino_react.react` and override the
  :meth:`get_apps_modifiers` so that it removes the `tinymce` plugin::

    class Site(Site):
        ...
        default_ui = 'lino_react.react'

        def get_apps_modifiers(self, **kw):
            kw = super(Site, self).get_apps_modifiers(**kw)
            # remove tinymce plugin
            kw.update(tinymce=None)
            return kw

- Run :manage:`collectstatic`::

    $ python manage.py collectstatic






Content
========

.. toctree::
   :maxdepth: 1

   API <api/index>
   specs/index
