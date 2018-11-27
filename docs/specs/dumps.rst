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



>>> test_client.force_login(rt.login('robin').user)

Must set the user profile, as py2js is used in the generation of lino_XXX_en.js and doesn't care about current session.
>>> set_user_profile(rt.login('robin').user.user_type)

Test py > json for Actors.

>>> t = rt.models.resolve("tickets.AllTickets")
>>> p = lambda o : pprint_json_string(py2js(o))

>>> p(t)
... #doctest: +ELLIPSIS -REPORT_UDIFF -SKIP
{
  "ba": {
    "as_pdf": {
      "an": "Table (landscape)",
      "window_action": null,
      "window_layout": null
    },
...
    "insert": {
      "an": "New",
      "window_action": true,
      "window_layout": {
        "main": {
          "items": [
            {
              "items": null,
              "label": "Summary",
              "repr": "<CharFieldElement summary in lino_noi.lib.tickets.models.TicketInsertLayout on lino_xl.lib.tickets.ui.Tickets>"
            },
            {
              "items": [
                {
                  "items": [
                    {
                      "items": null,
                      "label": "Ticket type",
                      "repr": "<ForeignKeyElement ticket_type in lino_noi.lib.tickets.models.TicketInsertLayout on lino_xl.lib.tickets.ui.Tickets>"
                    },
                    {
                      "items": null,
                      "label": "Priority",
                      "repr": "<ChoiceListFieldElement priority in lino_noi.lib.tickets.models.TicketInsertLayout on lino_xl.lib.tickets.ui.Tickets>"
                    },
                    {
                      "items": null,
                      "label": "End user",
                      "repr": "<ForeignKeyElement end_user in lino_noi.lib.tickets.models.TicketInsertLayout on lino_xl.lib.tickets.ui.Tickets>"
                    }
                  ],
                  "label": null,
                  "repr": "<Panel right in lino_noi.lib.tickets.models.TicketInsertLayout on lino_xl.lib.tickets.ui.Tickets>"
                },
                {
                  "items": null,
                  "label": "Description",
                  "repr": "<TextFieldElement description in lino_noi.lib.tickets.models.TicketInsertLayout on lino_xl.lib.tickets.ui.Tickets>"
                }
              ],
              "label": null,
              "repr": "<Panel main_2 in lino_noi.lib.tickets.models.TicketInsertLayout on lino_xl.lib.tickets.ui.Tickets>"
            }
          ],
          "label": null,
          "repr": "<DetailMainPanel main in lino_noi.lib.tickets.models.TicketInsertLayout on lino_xl.lib.tickets.ui.Tickets>"
        }
      }
    },
    ...
    "merge_row": {
      "an": "Merge",
      "window_action": true,
      "window_layout": {
        "main": {
          "items": [
            {
              "items": null,
              "label": "into...",
              "repr": "<ForeignKeyElement merge_to in lino.core.layouts.ActionParamsLayout on <lino.core.merge.MergeAction merge_row ('Merge')>>"
            },
            {
              "items": null,
              "label": "Reason",
              "repr": "<CharFieldElement reason in lino.core.layouts.ActionParamsLayout on <lino.core.merge.MergeAction merge_row ('Merge')>>"
            }
          ],
          "label": null,
          "repr": "<ActionParamsPanel main in lino.core.layouts.ActionParamsLayout on <lino.core.merge.MergeAction merge_row ('Merge')>>"
        }
      }
    },
    "show_as_html": {
      "an": "HTML",
      "window_action": null,
      "window_layout": null
    },
    ...
  "id": "tickets.AllTickets"
}

>>> from lino.modlib.about.models import About
>>> p(About)
... #doctest: +ELLIPSIS +REPORT_UDIFF -SKIP
{
  "ba": {
    "show": {
      "an": "Detail",
      "window_action": true,
      "window_layout": {
        "main": {
          "items": [
            {
              "items": null,
              "label": null,
              "repr": "<ConstantElement about_html in lino.core.layouts.DetailLayout on lino.modlib.about.models.About>"
            },
            {
              "items": null,
              "label": "Server status",
              "repr": "<DisplayElement server_status in lino.core.layouts.DetailLayout on lino.modlib.about.models.About>"
            }
          ],
          "label": null,
          "repr": "<DetailMainPanel main in lino.core.layouts.DetailLayout on lino.modlib.about.models.About>"
        }
      }
    }
  },
  "id": "about.About"
}

>>> pprint_json_string(test_client.get("/user/settings").content)
{
  "lang": "en",
  "site_data": "/media/cache/js/lino_900_en.js",
  "user_type": "900"
}
