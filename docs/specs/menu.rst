.. doctest docs/specs/menu.rst
.. _specs.menu:


>>> import lino
>>> lino.startup('lino_react.projects.teamReact.settings.demo')
>>> from lino.api.doctest import *
>>> from pprint import pprint

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
>>> print(json.dumps(json.loads(test_client.get("/ui/menu/?fmt=json").content),
... indent=2, sort_keys=True, separators=(",",": ")))
... #doctest: -ELLIPSIS +REPORT_UDIFF -SKIP
[
  {
    "menu": {
      "items": [
        {
          "handler": {
            "action": "grid.contacts.Persons",
            "rp": null,
            "status": {}
          },
          "text": "Persons",
          "toolTip": "Shows all persons."
        },
        {
          "handler": {
            "action": "grid.contacts.Companies",
            "rp": null,
            "status": {}
          },
          "text": "Organizations",
          "toolTip": "An organisation.  The verbose name is \"Organization\" while the\ninternal name is \"Company\" because the latter easier to type and\nfor historical reasons."
        },
        {
          "handler": {
            "action": "grid.lists.Lists",
            "rp": null,
            "status": {}
          },
          "text": "Partner Lists"
        }
      ]
    },
    "text": "Contacts"
  },
  {
    "menu": {
      "items": [
        {
          "handler": {
            "action": "grid.cal.MyEntries",
            "rp": null,
            "status": {}
          },
          "text": "My appointments",
          "toolTip": "Table of appointments for which I am responsible."
        },
        {
          "handler": {
            "action": "grid.cal.OverdueAppointments",
            "rp": null,
            "status": {}
          },
          "text": "Overdue appointments",
          "toolTip": "Shows overdue appointments, i.e. appointments whose date is\nover but who are still in a nonstable state."
        },
        {
          "handler": {
            "action": "grid.cal.MyUnconfirmedAppointments",
            "rp": null,
            "status": {}
          },
          "text": "Unconfirmed appointments",
          "toolTip": "Shows my appointments in the near future which are in suggested or\ndraft state."
        },
        {
          "handler": {
            "action": "grid.cal.MyTasks",
            "rp": null,
            "status": {}
          },
          "text": "My tasks",
          "toolTip": "Shows my tasks whose start date is today or in the future."
        },
        {
          "handler": {
            "action": "grid.cal.MyGuests",
            "rp": null,
            "status": {}
          },
          "text": "My guests",
          "toolTip": "The default table of presences."
        },
        {
          "handler": {
            "action": "grid.cal.MyPresences",
            "rp": null,
            "status": {}
          },
          "text": "My presences",
          "toolTip": "Shows all my presences in calendar events, independently of their\nstate."
        },
        {
          "handler": {
            "action": "grid.cal.MyOverdueAppointments",
            "rp": null,
            "status": {}
          },
          "text": "My overdue appointments",
          "toolTip": "Like OverdueAppointments, but only for myself."
        },
        {
          "handler": {
            "action": "grid.extensible.CalendarPanel",
            "rp": null,
            "status": {}
          },
          "iconCls": "x-tbar-calendar",
          "text": "Calendar",
          "toolTip": "Displays your events in a \"calendar view\"     with the possibility to switch between daily, weekly, monthly view."
        }
      ]
    },
    "text": "Calendar"
  },
  {
    "menu": {
      "items": [
        {
          "handler": {
            "action": "grid.excerpts.MyExcerpts",
            "rp": null,
            "status": {}
          },
          "text": "My Excerpts",
          "toolTip": "Base class for all tables on Excerpt."
        },
        {
          "handler": {
            "action": "grid.comments.MyComments",
            "rp": null,
            "status": {}
          },
          "text": "My Comments"
        },
        {
          "handler": {
            "action": "grid.comments.RecentComments",
            "rp": null,
            "status": {}
          },
          "text": "Recent comments"
        },
        {
          "handler": {
            "action": "grid.notify.MyMessages",
            "rp": null,
            "status": {}
          },
          "text": "My Notification messages",
          "toolTip": "Shows messages emitted to me."
        },
        {
          "handler": {
            "action": "grid.uploads.MyUploads",
            "rp": null,
            "status": {}
          },
          "text": "My Uploads",
          "toolTip": "Shows only my Uploads (i.e. those whose author is current user)."
        }
      ]
    },
    "text": "Office"
  },
  {
    "menu": {
      "items": [
        {
          "handler": {
            "action": "grid.tickets.MyTickets",
            "rp": null,
            "status": {}
          },
          "text": "My tickets",
          "toolTip": "Show all active tickets reported by me."
        },
        {
          "handler": {
            "action": "grid.tickets.ActiveTickets",
            "rp": null,
            "status": {}
          },
          "text": "Active tickets",
          "toolTip": "Show all tickets that are in an active state."
        },
        {
          "handler": {
            "action": "grid.tickets.AllTickets",
            "rp": null,
            "status": {}
          },
          "text": "All tickets",
          "toolTip": "Shows all tickets."
        },
        {
          "handler": {
            "action": "grid.tickets.UnassignedTickets",
            "rp": null,
            "status": {}
          },
          "text": "Unassigned Tickets",
          "toolTip": "Base class for all tables of tickets."
        },
        {
          "handler": {
            "action": "grid.tickets.RefTickets",
            "rp": null,
            "status": {}
          },
          "text": "Reference Tickets",
          "toolTip": "Shows all tickets that have a reference."
        },
        {
          "handler": {
            "action": "grid.tickets.MySites",
            "rp": null,
            "status": {}
          },
          "text": "My sites",
          "toolTip": "Shows the sites for which I have a subscription."
        },
        {
          "handler": {
            "action": "grid.tickets.MyTicketsToWork",
            "rp": null,
            "status": {}
          },
          "text": "Tickets to work",
          "toolTip": "Show all active tickets assigned to me."
        }
      ]
    },
    "text": "Tickets"
  },
  {
    "menu": {
      "items": [
        {
          "handler": {
            "action": "grid.working.MySessions",
            "rp": null,
            "status": {}
          },
          "text": "Sessions"
        },
        {
          "handler": {
            "action": "grid.working.ServiceReports",
            "rp": null,
            "status": {}
          },
          "text": "Service Reports"
        },
        {
          "handler": {
            "action": "grid.working.WorkedHours",
            "rp": null,
            "status": {}
          },
          "text": "Worked hours"
        }
      ]
    },
    "text": "Working time"
  },
  {
    "menu": {
      "items": [
        {
          "handler": {
            "action": "grid.github.MyCommits",
            "rp": null,
            "status": {}
          },
          "text": "My Commits"
        }
      ]
    },
    "text": "GitHub"
  },
  {
    "menu": {
      "items": [
        {
          "handler": {
            "action": "grid.mailbox.UnassignedMessages",
            "rp": null,
            "status": {}
          },
          "text": "Messages"
        }
      ]
    },
    "text": "Mailbox"
  },
  {
    "menu": {
      "items": [
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "detail.system.SiteConfigs",
                  "rp": null,
                  "status": {
                    "record_id": 1
                  }
                },
                "iconCls": "x-tbar-application_form",
                "text": "Site Parameters"
              },
              {
                "handler": {
                  "action": "grid.gfks.HelpTexts",
                  "rp": null,
                  "status": {}
                },
                "text": "Help Texts"
              },
              {
                "handler": {
                  "action": "grid.users.AllUsers",
                  "rp": null,
                  "status": {}
                },
                "text": "Users",
                "toolTip": "Shows the list of all users on this site."
              }
            ]
          },
          "text": "System"
        },
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.countries.Countries",
                  "rp": null,
                  "status": {}
                },
                "text": "Countries"
              },
              {
                "handler": {
                  "action": "grid.countries.Places",
                  "rp": null,
                  "status": {}
                },
                "text": "Places",
                "toolTip": "\n    The table of known geographical places.\n    A geographical place can be a city, a town, a suburb,\n    a province, a lake... any named geographic entity,\n    except for countries because these have their own table.\n    "
              }
            ]
          },
          "text": "Places"
        },
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.contacts.CompanyTypes",
                  "rp": null,
                  "status": {}
                },
                "text": "Organization types"
              },
              {
                "handler": {
                  "action": "grid.contacts.RoleTypes",
                  "rp": null,
                  "status": {}
                },
                "text": "Functions"
              },
              {
                "handler": {
                  "action": "grid.lists.ListTypes",
                  "rp": null,
                  "status": {}
                },
                "text": "List Types"
              }
            ]
          },
          "text": "Contacts"
        },
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.cal.Calendars",
                  "rp": null,
                  "status": {}
                },
                "text": "Calendars"
              },
              {
                "handler": {
                  "action": "grid.cal.AllRooms",
                  "rp": null,
                  "status": {}
                },
                "text": "Rooms",
                "toolTip": "List of rooms where calendar events can happen."
              },
              {
                "handler": {
                  "action": "grid.cal.Priorities",
                  "rp": null,
                  "status": {}
                },
                "text": "Priorities",
                "toolTip": "List of possible priorities of calendar events."
              },
              {
                "handler": {
                  "action": "grid.cal.RecurrentEvents",
                  "rp": null,
                  "status": {}
                },
                "text": "Recurring events",
                "toolTip": "The list of all recurrent events (RecurrentEvent)."
              },
              {
                "handler": {
                  "action": "grid.cal.GuestRoles",
                  "rp": null,
                  "status": {}
                },
                "text": "Guest roles",
                "toolTip": "Global table of guest roles."
              },
              {
                "handler": {
                  "action": "grid.cal.EventTypes",
                  "rp": null,
                  "status": {}
                },
                "text": "Calendar entry types",
                "toolTip": "The list of entry types defined on this site."
              },
              {
                "handler": {
                  "action": "grid.cal.EventPolicies",
                  "rp": null,
                  "status": {}
                },
                "text": "Recurrency policies",
                "toolTip": "Global table of all possible recurrencly policies."
              },
              {
                "handler": {
                  "action": "grid.cal.RemoteCalendars",
                  "rp": null,
                  "status": {}
                },
                "text": "Remote Calendars"
              },
              {
                "handler": {
                  "action": "grid.cal.DailyPlannerRows",
                  "rp": null,
                  "status": {}
                },
                "text": "Planner rows"
              }
            ]
          },
          "text": "Calendar"
        },
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.excerpts.ExcerptTypes",
                  "rp": null,
                  "status": {}
                },
                "text": "Excerpt Types",
                "toolTip": "Displays all rows of ExcerptType."
              },
              {
                "handler": {
                  "action": "grid.comments.CommentTypes",
                  "rp": null,
                  "status": {}
                },
                "text": "Comment Types",
                "toolTip": "The table with all existing comment types."
              },
              {
                "handler": {
                  "action": "grid.uploads.UploadTypes",
                  "rp": null,
                  "status": {}
                },
                "text": "Upload Types",
                "toolTip": "The table with all existing upload types."
              },
              {
                "handler": {
                  "action": "grid.tinymce.MyTextFieldTemplates",
                  "rp": null,
                  "status": {}
                },
                "text": "My Text Field Templates"
              }
            ]
          },
          "text": "Office"
        },
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.tickets.TicketTypes",
                  "rp": null,
                  "status": {}
                },
                "text": "Ticket types"
              },
              {
                "handler": {
                  "action": "grid.tickets.AllSites",
                  "rp": null,
                  "status": {}
                },
                "text": "Sites"
              }
            ]
          },
          "text": "Tickets"
        },
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.working.SessionTypes",
                  "rp": null,
                  "status": {}
                },
                "text": "Session Types"
              }
            ]
          },
          "text": "Working time"
        },
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.github.Repositories",
                  "rp": null,
                  "status": {}
                },
                "text": "Repositories"
              }
            ]
          },
          "text": "GitHub"
        },
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.mailbox.Mailboxes",
                  "rp": null,
                  "status": {}
                },
                "text": "Mailboxes"
              }
            ]
          },
          "text": "Mailbox"
        }
      ]
    },
    "text": "Configure"
  },
  {
    "menu": {
      "items": [
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.gfks.ContentTypes",
                  "rp": null,
                  "status": {}
                },
                "text": "content types",
                "toolTip": "Default table for django.contrib.ContentType."
              },
              {
                "handler": {
                  "action": "grid.users.Authorities",
                  "rp": null,
                  "status": {}
                },
                "text": "Authorities"
              },
              {
                "handler": {
                  "action": "grid.users.UserTypes",
                  "rp": null,
                  "status": {}
                },
                "text": "User types",
                "toolTip": "The list of user types available in this application."
              },
              {
                "handler": {
                  "action": "grid.users.UserRoles",
                  "rp": null,
                  "status": {}
                },
                "text": "User roles"
              },
              {
                "handler": {
                  "action": "grid.changes.Changes",
                  "rp": null,
                  "status": {}
                },
                "text": "Changes",
                "toolTip": "The default table for Change."
              },
              {
                "handler": {
                  "action": "grid.notify.AllMessages",
                  "rp": null,
                  "status": {}
                },
                "text": "Notification messages",
                "toolTip": "The gobal list of all messages."
              },
              {
                "handler": {
                  "action": "grid.checkdata.Checkers",
                  "rp": null,
                  "status": {}
                },
                "text": "Data checkers",
                "toolTip": "The list of data problem types known by this application."
              },
              {
                "handler": {
                  "action": "grid.checkdata.AllProblems",
                  "rp": null,
                  "status": {}
                },
                "text": "Data problems",
                "toolTip": "Show all data problems."
              },
              {
                "handler": {
                  "action": "grid.dashboard.AllWidgets",
                  "rp": null,
                  "status": {}
                },
                "text": "All dashboard widgets"
              },
              {
                "handler": {
                  "action": "grid.userstats.UserStats",
                  "rp": null,
                  "status": {}
                },
                "text": "User Statistics"
              }
            ]
          },
          "text": "System"
        },
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.contacts.Roles",
                  "rp": null,
                  "status": {}
                },
                "text": "Contact Persons"
              },
              {
                "handler": {
                  "action": "grid.contacts.Partners",
                  "rp": null,
                  "status": {}
                },
                "text": "Partners"
              },
              {
                "handler": {
                  "action": "grid.lists.AllMembers",
                  "rp": null,
                  "status": {}
                },
                "text": "List memberships"
              }
            ]
          },
          "text": "Contacts"
        },
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.cal.AllEntries",
                  "rp": null,
                  "status": {}
                },
                "text": "events",
                "toolTip": "Table which shows all calendar events."
              },
              {
                "handler": {
                  "action": "grid.cal.Tasks",
                  "rp": null,
                  "status": {}
                },
                "text": "Tasks",
                "toolTip": "Global table of all tasks for all users."
              },
              {
                "handler": {
                  "action": "grid.cal.Subscriptions",
                  "rp": null,
                  "status": {}
                },
                "text": "Subscriptions"
              },
              {
                "handler": {
                  "action": "grid.cal.EntryStates",
                  "rp": null,
                  "status": {}
                },
                "text": "Event states",
                "toolTip": "The possible states of a calendar entry.\nStored in the state field."
              },
              {
                "handler": {
                  "action": "grid.cal.GuestStates",
                  "rp": null,
                  "status": {}
                },
                "text": "Guest states",
                "toolTip": "Global choicelist of possible guest states."
              },
              {
                "handler": {
                  "action": "grid.cal.TaskStates",
                  "rp": null,
                  "status": {}
                },
                "text": "Task states",
                "toolTip": "Possible values for the state of a Task. The list of\nchoices for the Task.state field."
              }
            ]
          },
          "text": "Calendar"
        },
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.excerpts.AllExcerpts",
                  "rp": null,
                  "status": {}
                },
                "text": "Excerpts",
                "toolTip": "Base class for all tables on Excerpt."
              },
              {
                "handler": {
                  "action": "grid.comments.AllComments",
                  "rp": null,
                  "status": {}
                },
                "text": "Comments"
              },
              {
                "handler": {
                  "action": "grid.uploads.AllUploads",
                  "rp": null,
                  "status": {}
                },
                "text": "Uploads",
                "toolTip": "Shows all Uploads"
              },
              {
                "handler": {
                  "action": "grid.uploads.UploadAreas",
                  "rp": null,
                  "status": {}
                },
                "text": "Upload Areas"
              },
              {
                "handler": {
                  "action": "grid.tinymce.TextFieldTemplates",
                  "rp": null,
                  "status": {}
                },
                "text": "Text Field Templates"
              }
            ]
          },
          "text": "Office"
        },
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.tickets.Links",
                  "rp": null,
                  "status": {}
                },
                "text": "Dependencies"
              },
              {
                "handler": {
                  "action": "grid.tickets.TicketStates",
                  "rp": null,
                  "status": {}
                },
                "text": "Ticket states",
                "toolTip": "The choicelist of possible values for the state of a ticket."
              },
              {
                "handler": {
                  "action": "grid.tickets.Subscriptions",
                  "rp": null,
                  "status": {}
                },
                "text": "Site subscriptions"
              }
            ]
          },
          "text": "Tickets"
        },
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.working.Sessions",
                  "rp": null,
                  "status": {}
                },
                "text": "Sessions"
              },
              {
                "handler": {
                  "action": "grid.working.AllSummaries",
                  "rp": null,
                  "status": {}
                },
                "text": "Site summaries"
              }
            ]
          },
          "text": "Working time"
        },
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.github.Commits",
                  "rp": null,
                  "status": {}
                },
                "text": "Commits"
              }
            ]
          },
          "text": "GitHub"
        },
        {
          "menu": {
            "items": [
              {
                "handler": {
                  "action": "grid.mailbox.Messages",
                  "rp": null,
                  "status": {}
                },
                "text": "Messages"
              }
            ]
          },
          "text": "Mailbox"
        }
      ]
    },
    "text": "Explorer"
  },
  {
    "menu": {
      "items": [
        {
          "handler": {
            "action": "show.about.About",
            "rp": null,
            "status": {
              "record_id": -99998
            }
          },
          "text": "About",
          "toolTip": "Show information about this site."
        }
      ]
    },
    "text": "Site"
  }
]
