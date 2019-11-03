from lino.core.constants import ICON_NAMES

REACT_ICON_NAMES = """pi-step-backward-alt
pi-step-forward-alt
pi-forward
pi-backward
pi-fast-backward
pi-fast-forward
pi-pause
pi-play
pi-compass
pi-id-card
pi-ticket
pi-file-o
pi-reply
pi-directions-alt
pi-directions
pi-thumbs-up
pi-thumbs-down
pi-sort-numeric-down-alt
pi-sort-numeric-up-alt
pi-sort-alpha-down-alt
pi-sort-alpha-up-alt
pi-sort-numeric-down
pi-sort-numeric-up
pi-sort-alpha-down
pi-sort-alpha-up
pi-sort-alt
pi-sort-amount-up
pi-sort-amount-down
pi-sort-amount-down-alt
pi-sort-amount-up-alt
pi-palette
pi-undo
pi-desktop
pi-sliders-v
pi-sliders-h
pi-search-plus
pi-search-minus
pi-file-excel
pi-file-pdf
pi-check-square
pi-chart-line
pi-user-edit
pi-exclamation-circle
pi-android
pi-google
pi-apple
pi-microsoft
pi-heart
pi-mobile
pi-tablet
pi-key
pi-shopping-cart
pi-comments
pi-comment
pi-briefcase
pi-bell
pi-paperclip
pi-share-alt
pi-envelope
pi-volume-down
pi-volume-up
pi-volume-off
pi-eject
pi-money-bill
pi-images
pi-image
pi-sign-in
pi-sign-out
pi-wifi
pi-sitemap
pi-chart-bar
pi-camera
pi-dollar
pi-lock-open
pi-table
pi-map-marker
pi-list
pi-eye-slash
pi-eye
pi-folder-open
pi-folder
pi-video
pi-inbox
pi-lock
pi-unlock
pi-tags
pi-tag
pi-power-off
pi-save
pi-question-circle
pi-question
pi-copy
pi-file
pi-clone
pi-calendar-times
pi-calendar-minus
pi-calendar-plus
pi-ellipsis-v
pi-ellipsis-h
pi-bookmark
pi-globe
pi-replay
pi-filter
pi-print
pi-align-right
pi-align-left
pi-align-center
pi-align-justify
pi-cog
pi-cloud-download
pi-cloud-upload
pi-cloud
pi-pencil
pi-users
pi-clock
pi-user-minus
pi-user-plus
pi-trash
pi-window-minimize
pi-window-maximize
pi-external-link
pi-refresh
pi-user
pi-exclamation-triangle
pi-calendar
pi-chevron-circle-left
pi-chevron-circle-down
pi-chevron-circle-right
pi-chevron-circle-up
pi-angle-double-down
pi-angle-double-left
pi-angle-double-right
pi-angle-double-up
pi-angle-down
pi-angle-left
pi-angle-right
pi-angle-up
pi-upload
pi-download
pi-ban
pi-star-o
pi-star
pi-chevron-left
pi-chevron-right
pi-chevron-down
pi-chevron-up
pi-caret-left
pi-caret-right
pi-caret-down
pi-caret-up
pi-search
pi-check
pi-check-circle
pi-times
pi-times-circle
pi-plus
pi-plus-circle
pi-minus
pi-minus-circle
pi-circle-on
pi-circle-off
pi-sort-down
pi-sort-up
pi-sort
pi-step-backward
pi-step-forward
pi-th-large
pi-arrow-down
pi-arrow-left
pi-arrow-right
pi-arrow-up
pi-bars
pi-arrow-circle-down
pi-arrow-circle-left
pi-arrow-circle-right
pi-arrow-circle-up
pi-info
pi-info-circle
pi-home
pi-spinner""".split()

REACT_ICON_MAPPING = {
    "arrow_join": None,
    "arrow_up": "pi-arrow-up",
    "arrow_down": "pi-arrow-down",
    "delete": "pi-trash",
    "add": "pi-plus-circle",
    "book_link": "pi-external-link",
    "eye": "pi-eye",
    "basket": "pi-shopping-cart",
    "emoticon_smile": None,
    "pencil": "ip-pencil",
    "cross": "pi-times",
    "money": "pi-money-bill",
    "application_form": "pi-table",
    "application_view_list": "pi-list",
    "application_view_detail": "pi-id-card",
    "disk": "pi-save",
    "hourglass": None,
    "date_add": "pi-calendar-plus",
    "email_add": "pi-envelope",
    "email_go": "pi-envelope",
    "script": "pi-file-o",
    "script_add": None,
    "bell": "pi-bell",
    "calendar": "pi-calendar",
    "printer": "pi-print",
    "lightning": None,
    "printer_delete": None,
    "arrow_divide": None,
    "page_white_acrobat": "pi-file-pdf",
    "page_excel": "pi-file-excel",
    "html": "pi-file-o",
    "vcard": "pi-id-card",
    "vcard_add": "pi-id-card",
    "wrench": "pi-cog",
    "transmit": "pi-cloud-upload",
    "accept": "pi-check-circle",
    "database_gear": "pi-cog", # not perfect...
    "cancel": "pi-times-circle",
    "flag_green": None,
    "date_next": None, # pr only has cal, cal+ cal- and calx
}

# allow direct mapping pi-uplaods -> pi-uploads
REACT_ICON_MAPPING.update({icon : icon for icon in REACT_ICON_NAMES})
