.. doctest docs/specs/dumps.rst
.. _specs.dumps:

=====
dumps
=====


>>> import lino
>>> lino.startup('lino_react.projects.teamReact.settings.demo')
>>> from lino.api.doctest import *
>>> from pprint import pprint
>>> from lino.utils.jsgen import py2js
>>> from lino.modlib.users.utils import get_user_profile, set_user_profile, with_user_profile
>>> from lino.modlib.users.choicelists import UserTypes
>>> anon = UserTypes.choices[0][0]


Must set the user profile, as py2js is used in the generation of lino_XXX_en.js and doesn't care about current session.

>>> test_client.force_login(rt.login('robin').user)
>>> set_user_profile(rt.login('robin').user.user_type)

Test py > json for Actors.

>>> t = rt.models.resolve("tickets.AllTickets")
>>> p = lambda o : pprint_json_string(py2js(o))
>>> rt.settings.SITE.kernel.default_renderer.serialise_js_code = True


>>> p(t)
... #doctest: +ELLIPSIS -REPORT_UDIFF -SKIP
{...}

>>> from lino.modlib.about.models import About
>>> p(About)
... #doctest: +ELLIPSIS +REPORT_UDIFF +SKIP
{
  "ba": {
    "default_action": {
      "an": "show",
      "http_method": "GET",
      "label": "Detail",
      "select_rows": true,
      "toolbarActions": [],
      "window_action": true,
      "window_layout": {
        "main": {
          "editable": false,
          "hflex": true,
          "hidden": false,
          "hpad": 1,
          "is_fieldset": true,
          "items": [
            {
              "editable": false,
              "hflex": true,
              "hidden": false,
              "label": null,
              "name": "about_html",
              "preferred_width": 10,
              "react_name": "ConstantElement",
              "repr": "<ConstantElement about_html in lino.core.layouts.DetailLayout on lino.modlib.about.models.About>",
              "value": {
                "flex": 25,
                "html": "..."
              },
              "vflex": true,
              "width": null
            },
            {
              "editable": false,
              "field_options": {
                "disabled": true,
                "fieldLabel": "Server status",
                "labelAlign": "top",
                "name": "server_status"
              },
              "hflex": true,
              "hidden": false,
              "label": "Server status",
              "name": "server_status",
              "preferred_width": 30,
              "react_name": "DisplayElement",
              "repr": "<DisplayElement server_status in lino.core.layouts.DetailLayout on lino.modlib.about.models.About>",
              "value": {
                "always_enabled": true,
                "quicktip": "(Server status,(about.About.server_status) )",
                "value": "<br/>"
              },
              "vflex": false,
              "width": null
            }
          ],
          "label": null,
          "name": "main",
          "preferred_width": 30,
          "react_name": "DetailMainPanel",
          "repr": "<DetailMainPanel main in lino.core.layouts.DetailLayout on lino.modlib.about.models.About>",
          "value": {
            "autoScroll": true,
            "hideCheckBoxLabels": true,
            "layout": {
              "align": "stretch",
              "type": "vbox"
            }
          },
          "vertical": true,
          "vflex": true,
          "width": null
        }
      }
    },
    "detail_action": {
      "an": "show",
      "http_method": "GET",
      "label": "Detail",
      "select_rows": true,
      "toolbarActions": [],
      "window_action": true,
      "window_layout": {
        "main": {
          "editable": false,
          "hflex": true,
          "hidden": false,
          "hpad": 1,
          "is_fieldset": true,
          "items": [
            {
              "editable": false,
              "hflex": true,
              "hidden": false,
              "label": null,
              "name": "about_html",
              "preferred_width": 10,
              "react_name": "ConstantElement",
              "repr": "<ConstantElement about_html in lino.core.layouts.DetailLayout on lino.modlib.about.models.About>",
              "value": {
                "flex": 25,
                "html": "..."
              },
              "vflex": true,
              "width": null
            },
            {
              "editable": false,
              "field_options": {
                "disabled": true,
                "fieldLabel": "Server status",
                "labelAlign": "top",
                "name": "server_status"
              },
              "hflex": true,
              "hidden": false,
              "label": "Server status",
              "name": "server_status",
              "preferred_width": 30,
              "react_name": "DisplayElement",
              "repr": "<DisplayElement server_status in lino.core.layouts.DetailLayout on lino.modlib.about.models.About>",
              "value": {
                "always_enabled": true,
                "quicktip": "(Server status,(about.About.server_status) )",
                "value": "<br/>"
              },
              "vflex": false,
              "width": null
            }
          ],
          "label": null,
          "name": "main",
          "preferred_width": 30,
          "react_name": "DetailMainPanel",
          "repr": "<DetailMainPanel main in lino.core.layouts.DetailLayout on lino.modlib.about.models.About>",
          "value": {
            "autoScroll": true,
            "hideCheckBoxLabels": true,
            "layout": {
              "align": "stretch",
              "type": "vbox"
            }
          },
          "vertical": true,
          "vflex": true,
          "width": null
        }
      }
    },
    "show": {
      "an": "show",
      "http_method": "GET",
      "label": "Detail",
      "select_rows": true,
      "toolbarActions": [],
      "window_action": true,
      "window_layout": {
        "main": {
          "editable": false,
          "hflex": true,
          "hidden": false,
          "hpad": 1,
          "is_fieldset": true,
          "items": [
            {
              "editable": false,
              "hflex": true,
              "hidden": false,
              "label": null,
              "name": "about_html",
              "preferred_width": 10,
              "react_name": "ConstantElement",
              "repr": "<ConstantElement about_html in lino.core.layouts.DetailLayout on lino.modlib.about.models.About>",
              "value": {
                "flex": 25,
                "html": "..."
              },
              "vflex": true,
              "width": null
            },
            {
              "editable": false,
              "field_options": {
                "disabled": true,
                "fieldLabel": "Server status",
                "labelAlign": "top",
                "name": "server_status"
              },
              "hflex": true,
              "hidden": false,
              "label": "Server status",
              "name": "server_status",
              "preferred_width": 30,
              "react_name": "DisplayElement",
              "repr": "<DisplayElement server_status in lino.core.layouts.DetailLayout on lino.modlib.about.models.About>",
              "value": {
                "always_enabled": true,
                "quicktip": "(Server status,(about.About.server_status) )",
                "value": "<br/>"
              },
              "vflex": false,
              "width": null
            }
          ],
          "label": null,
          "name": "main",
          "preferred_width": 30,
          "react_name": "DetailMainPanel",
          "repr": "<DetailMainPanel main in lino.core.layouts.DetailLayout on lino.modlib.about.models.About>",
          "value": {
            "autoScroll": true,
            "hideCheckBoxLabels": true,
            "layout": {
              "align": "stretch",
              "type": "vbox"
            }
          },
          "vertical": true,
          "vflex": true,
          "width": null
        }
      }
    }
  },
  "default_action": "show",
  "detail_action": "show",
  "editable": false,
  "id": "about.About",
  "label": "About",
  "preview_limit": null,
  "slave": false
}


>>> pprint_json_string(test_client.get("/user/settings").content)
... #doctest: +ELLIPSIS +REPORT_UDIFF +SKIP
{
  "lang": "en",
  "logged_in": true,
  "site_data": "/media/cache/json/lino_900_en.json",
  "user_type": "900",
  "username": "Robin Rood"
}


>>> pprint_json_string(py2js(t.actions['detail']))
... #doctest: +ELLIPSIS +REPORT_UDIFF +SKIP


Also test for Anon user

>>> set_user_profile(anon)
>>> p(t)
... #doctest: +ELLIPSIS -REPORT_UDIFF -SKIP
{...}
