.. _react:

========================
React front end for Lino
========================

This is the documentation tree for :mod:`lino_react`.


.. py2rst::

  from lino_react import SETUP_INFO
  print(SETUP_INFO['long_description'])


How to try it:

- Install some Lino application as explained in :ref:`lino.dev.install`.

- In your :xfile:`settings.py` file, set the :attr:`default_ui`
  attribute to :mod:`lino_react.react`::

    class Site(Site):
        ...
        default_ui = 'lino_react.react'
        ...

- Run :manage:`collectstatic`::

    $ python manage.py collectstatic

Content
========

.. toctree::
   :maxdepth: 1

   changes/index
   API <api/index>
   specs/index
