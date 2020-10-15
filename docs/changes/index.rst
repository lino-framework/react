.. _react.changes:


=========
Changelog
=========

See https://www.lino-framework.org/changes/index.html

.. toctree::
   :maxdepth: 1

   2020
   0.1.0
   0.0.0

Design Questions
================

translating actions into urls.

/packid/actori/ - run default action
/packid/actori/:id - run detail action

have an array/queue of actions being run
vaurous actions do differnt things

grid action redirexts to the correct actors grid route
detail action same or dialog
simple actions are run on ro6ws
param actions require input in thr form of a dialog form
insert actions are either a dialog or route

have an action stack which has an actionRenderer
use route.redirect
