import React from "react";
import ReactDOM from "react-dom";

import key from "weak-key";

import classNames from 'classnames';
import queryString from "query-string"

import DataProvider from "./DataProvider";
import {DashboardItems} from "./DashboardItems";
import Table from "./Table";
import Menu from "./Menu";
import {AppMenu} from './AppMenu';
import {AppTopbar} from './AppTopbar';
import {AppInlineProfile} from "./AppInlineProfile"
// import {SignInDialog} from './SignInDialog'
import {Actor} from "./Actor";
//import {LinoGrid} from "./LinoGrid";
import {LinoDialog} from './LinoDialog'
import {LinoChats} from './LinoChatter/LinoChats'
import LinoBbar from "./LinoBbar";
import {pvObj2array, deepCompare} from "./LinoUtils"


import {Sidebar} from 'primereact/sidebar';
import {PanelMenu} from 'primereact/panelmenu';
import {Button} from 'primereact/button';
import {ScrollPanel} from 'primereact/components/scrollpanel/ScrollPanel';
import {OverlayPanel} from 'primereact/overlaypanel';
import {ProgressSpinner} from 'primereact/progressspinner';
import {Growl} from 'primereact/growl';
import DomHandler from 'primereact/domhandler';

import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

import './layout/layout.css';
import './App.css';


import {BrowserRouter as Router, HashRouter, Route, Link} from "react-router-dom";

import {Redirect} from 'react-router-dom';

import {fetch as fetchPolyfill} from 'whatwg-fetch'

import ReconnectingWebSocket from 'reconnecting-websocket';

import {SiteContext, ActorData} from "./SiteContext"

let Lino = {}; // For action.preprocessing for appy mixins.
Lino.get_current_grid_config = function (rp_obj, ajax_args) {
    rp_obj.get_URL_PARAM_COLUMNS(ajax_args);
};

class App extends React.Component {

    constructor() {
        super();
        this.state = {
            visible: true,
            layoutMode: 'static',
            layoutColorMode: 'dark',
            staticMenuInactive: false,
            overlayMenuActive: false,
            mobileMenuActive: false,

            site_loaded: false,
            site_data: null,
            menu_data: null,
            user_settings: null,

            logging_in: false,

            dialogs: [],
            // Topbar states // Disabled until global search api documentation is found.
            // searchValue: "",
            // searchSuggestions: []

            WS: false, // Websocket status
            openedconversations: [],

        };

        this.rps = {}; // used for rp
        this.dialogRefs = {}; // used for getting and focusing on the previous dialog from dialog props obj.
        this.response_callbacks = {}; // Used to store respnce callback functions when using confirmation callbacks.
        this.onWrapperClick = this.onWrapperClick.bind(this);
        this.onToggleMenu = this.onToggleMenu.bind(this);
        this.onSidebarClick = this.onSidebarClick.bind(this);
        this.onMenuItemClick = this.onMenuItemClick.bind(this);

        this.onHomeButton = this.onHomeButton.bind(this);

        this.onSignOutIn = this.onSignOutIn.bind(this);
        // this.onSignIn = this.onSignIn.bind(this);

        this.handleActionResponse = this.handleActionResponse.bind(this);
        this.runAction = this.runAction.bind(this);
        this.onAuthoritiesSelect = this.onAuthoritiesSelect.bind(this);
        this.add_su = this.add_su.bind(this);
        // this.searchMethod = this.searchMethod.bind(this);

        this.notification_web_socket = this.notification_web_socket.bind(this);
        this.push = this.push.bind(this);
        this.pushChat = this.pushChat.bind(this);

        this.sendChat = this.sendChat.bind(this);
        this.sendSeenAction = this.sendSeenAction.bind(this);
        this.OpenConversation = this.OpenConversation.bind(this);

        this.onChatButton = this.onChatButton.bind(this);
        this.positionChatOp = this.positionChatOp.bind(this);
        this.chatwindow = React.createRef()

        this.fetch_user_settings();

        this.onMainWindowUpdate = this.onMainWindowUpdate.bind(this);

        window.App = this;
        // console.log(window, window.App);
    }

    componentDidMount() {
        this.WindowStateManager = new window.WindowStateManager(true, true, this.onMainWindowUpdate);
        window.addEventListener('resize', this.positionChatOp);

    }

    onMainWindowUpdate(WSM) {
        // console.log("Change in main window" + WSM.isMainWindow())
    }

    // #3070: Add function to open the settings page of the current user 
    onMysettings(event) {
        // Open the detail view of the current user settings.
        Notifier.start("Title", "Here is context", "www.google.com", "validated image url");
        this.runAction({
            "actorId": "users.MySettings",
            "an": "detail",
            "onMain": true,
            "rp": null,
            "status": {"record_id": this.state.user_settings.user_id}
        })
    }

    onSignOutIn(event) {
        if (!this.state.user_settings.logged_in) {
            // this.setState({logging_in: true})
            this.runAction({
                "actorId": "users.UsersOverview",
                "an": "sign_in",
                "onMain": true,
                "rp": null,
                "status": {
                    // "field_values": {"password": "", "username": ""},
                    // "fv": ["", ""],
                }
            })
        }
        else {
            // log_out logout
            fetchPolyfill("/auth").then((req) => {
                this.webSocketBridge && this.webSocketBridge.close();
                this.chatOp && this.chatOp.hide();
                this.fetch_user_settings();
                this.router.history.push("/");
                this.dashboard.reloadData();
            })
        }

    }

    // onSignIn(payload) {
    //     // event.preventDefault();
    //     // let payload = {
    //     //     username: this.state.username,
    //     //     password: this.state.password
    //     // };
    //     let data = Object.keys(payload).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(payload[key])).join('&');
    //     // let data = new FormData();
    //     // data.append("json", JSON.stringify(payload));
    //     // Object.entries(payload).map((k,v) => data.append(k,v));
    //     this.setState({logging_in: false});
    //     fetchPolyfill("/auth",
    //         {
    //             headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    //             method: "POST",
    //             body: data
    //         }
    //     ).then((res) => (res.json())
    //     ).then((data) => {
    //         if (data.success) {
    //             this.fetch_user_settings();
    //             this.dashboard.reloadData();
    //
    //         }
    //     }).catch(error => window.App.handleAjaxException(error));
    //
    // }

    setRpRef(el, manual_rp) {
        if (el) {
            let rp = manual_rp === undefined ? key(el) : manual_rp;
            window.App.rps[rp] = el;
            el.rp = rp;
        }
    }

    onAuthoritiesSelect(auth_obj) {
        let id = auth_obj[0];
        this.fetch_user_settings(id);

    }

    onWrapperClick(event) {
        // console.log("onWrapperClick", this.menuClick);
        if (!this.menuClick
            && (this.state.overlayMenuActive || this.state.mobileMenuActive) // prevents rerendering all the time on-click
        ) {
            this.setState({
                overlayMenuActive: false,
                mobileMenuActive: false
            });
        }

        this.menuClick = false;
    }

    onHomeButton(event) {
        if (this.router.history.location.pathname !== "/") {
            this.router.history.push("/");
        }
        else {
            this.dashboard.reloadData()
        }

    }

    onToggleMenu(event) {
        this.menuClick = true;

        if (this.isDesktop()) {
            if (this.state.layoutMode === 'overlay') {
                this.setState({
                    overlayMenuActive: !this.state.overlayMenuActive
                });
            }
            else if (this.state.layoutMode === 'static') {
                this.setState({
                    staticMenuInactive: !this.state.staticMenuInactive
                });
            }
        }
        else {
            const mobileMenuActive = this.state.mobileMenuActive;
            this.setState({
                mobileMenuActive: !mobileMenuActive
            });
        }

        event.preventDefault();
    }

    onSidebarClick(event) {
        this.menuClick = true;
        setTimeout(() => {
            this.layoutMenuScroller.moveBar();
        }, 500);
    }

    onMenuItemClick(event) {
        if (!event.item.items) {
            this.setState({
                overlayMenuActive: false,
                mobileMenuActive: false
            })
        }
    }

    addClass(element, className) {
        if (element.classList)
            element.classList.add(className);
        else
            element.className += ' ' + className;
    }

    removeClass(element, className) {
        if (element.classList)
            element.classList.remove(className);
        else
            element.className = element.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }

    isDesktop() {
        return window.innerWidth > 1024;
    }

    componentDidUpdate() {
        if (this.state.mobileMenuActive)
            this.addClass(document.body, 'body-overflow-hidden');
        else
            this.removeClass(document.body, 'body-overflow-hidden');
    }

    onChatButton(e) {
        this.setState({
            chatOpen: new Date()
        })
        this.chatOp.toggle(e)
        // this.chatwindow.reload() // fetch init messages
    }

    positionChatOp(e) {
        if (this.chatOp && this.chatOp.isVisible()) {
            this.chatOp.hide();
            this.chatOp.show({target: window.App.chatButton});
        }
    }

    OpenConversation(conversation_id) {
        console.log('conversation_id', conversation_id)
        if (!this.state.openedconversations.includes(conversation_id)) {
            this.setState(prevState => ({openedconversations: prevState.openedconversations.concat(conversation_id)}));
        }
    }

    notification_web_socket(user_settings) {

        console.warn("NWS");
        if (!window.Lino || !window.Lino.useWebSockets) return;

        let {user_id} = user_settings || this.state.user_settings;

        if (this.webSocketBridge) {
            this.webSocketBridge.close();
            this.setState({
                WS: false
            })
        }

        // this.webSocketBridge = new WebSocket(ws_path); // original
        this.webSocketBridge = new ReconnectingWebSocket(
            (window.location.protocol === "https:" ? "wss" : "ws") + "://" + window.location.host + "/WS/",
            [], // protocalls, not needed
            {} //options, see https://www.npmjs.com/package/reconnecting-websocket
        );

        // Helpful debugging
        this.webSocketBridge.onclose = (e) => {
            console.log(e, "WS closed");
            if (this.state.WS) {
                // lost connection from server for first time atm.
                // Commented out, too distracting, pops up also when closed normally, via a page refresh
                /*this.growl.show({
                    severity: "error",
                    summary: "Connection to Lino server lost",
                    detail: "Please wait, and contact system administrator if the problem persists."
                });*/
            }

            this.setState(() => {
                return {
                    WS: false,
                    foo: true
                }
            });
            // console.log("Disconnected from chat socket");
        };

        // this.webSocketBridge.connect();
        this.webSocketBridge.addEventListener('open', () => {
            console.log("lino connecting ...");
            // this.webSocketBridge.send(JSON.stringify({
            //     "command": "user_connect",
            //     "username": user_id
            // }));
            this.setState(() => {
                return {WS: true}
            })
        });


        this.webSocketBridge.onmessage = (e) => {

            let data = JSON.parse(e.data);
            console.log("Recived message ", data);
            if (data.type === "NOTIFICATION") {
                this.push(data)
            } else if (data.type === "CHAT") {
                // console.log("Got Chat", data);
                //body: "test\n\n", created: "Wed 12 Feb 2020 17:25", user: "tonis"
                if (!document.hasFocus() && this.WindowStateManager.isMainWindow()) {
                    let userName = data.chat[0];
                    this.pushChat("New message from: " + userName[0].toLocaleUpperCase() + userName.slice(1),
                        data.body,
                        undefined, //icon,// todo icon, user avitar
                        data.chat, //chat data
                    );
                } else if (document.hasFocus()) {
                    // todo main and focused, make small visual notifiation
                }

                // todo update chatter to show unseen bubble notification should be done for all chat windows.
                // todo have recived messages forwarded to linochats
                this.LinoChats.consume_WS_message(data.chat);
                //this.consume_incoming_chat(data)
            }
        }
    }

    sendChat(data) {
        // TODO check that WS is up before sending
        // let {user_id} = this.state.user_settings;
        this.webSocketBridge.send(
            JSON.stringify(
                {
                    body: data,
                    function: 'onRecive'
                }
            )
        )
    }
    sendSeenAction(group_id, messages) {
        this.webSocketBridge.send(
            JSON.stringify(
                {
                    body: [group_id],
                    function: 'markAsSeen'
                }
            )
        )
    }

    pushPermission() {
        let onGranted = () => console.log("onGranted");
        let onDenied = () => console.log("onDenied");
        // Ask for permission if it's not already granted
        Push.Permission.request(onGranted, onDenied);
    }

    pushChat(subject, body, icon = undefined, chat=undefined) {
        var app = this;
        this.pushPermission();
        try {
            Push.create(subject, {
                body: body,
                icon: icon || '/static/img/lino-logo.png',
                onClick: function () {

                    /*if (!app.chatOp.isVisible()) {
                        app.chatOp.show({target: window.App.chatButton});
                    }
                    app.chatwindow.focus();*/
                    this.linoChats.pushCallback(chat)

                }
            });
            // if (false && Number.isInteger(action["id"])){
            //     this.webSocketBridge.stream('lino').send({message_id: action["id"]})
            //     this.webSocketBridge.send(JSON.stringify({
            //                     "command": "seen",
            //                     "message_id": action["id"],
            //                 }));
            //             }
        }
        catch (err) {
            console.log(err.message);
        }

    }

    push(data) {
        let {body, subject} = data;
        console.log("We get the message ", data);
        // let message = data['message'];
        this.pushPermission();
        try {
            Push.create(subject, {
                body: body,
                icon: '/static/img/lino-logo.png',
                onClick: function () {
                    // todo include the url to where the notifiaton reffers to
                    window.focus();
                    window.App.dashboard.reload();
                    this.close();
                }
            });
            // if (false && Number.isInteger(action["id"])){
            //     this.webSocketBridge.stream('lino').send({message_id: action["id"]})
            //     this.webSocketBridge.send(JSON.stringify({
            //                     "command": "seen",
            //                     "message_id": action["id"],
            //                 }));
            //             }
        }
        catch (err) {
            console.log(err.message);
        }

    }

    fetch_user_settings = (su_id) => {
        this.setState({ // clear current settings
            // logging_in: false,/
            su_id: undefined,
            site_loaded: false,
            site_data: null,
            menu_data: null,
            user_settings: null,
        })
        let url = "/user/settings/";
        if (su_id) url += `?su=${su_id}`;

        fetchPolyfill(url).then(
            this.handleAjaxResponse
        ).then((data) => {
                let store = window.localStorage,
                    lv = store.getItem("lv");
                if (lv !== data["lv"]) { // need to update layout data.
                    store.clear();
                    store.setItem("lv", data["lv"]) // lino_version
                }
                ;
                this.setState({
                    user_settings: data,
                    su_id: data.su_id,
                });

                this.notification_web_socket(data);

                return this.fetch_site_data(data.site_data);
            }
        ).catch(error => window.App.handleAjaxException(error));
    };

    fetch_site_data = (uri) => {
        return fetchPolyfill(uri)
            .then(response => {
                if (response.status !== 200) {
                    return this.setState({placeholder: "Something went wrong"});
                }
                return this.handleAjaxResponse(response);
            })
            .then(data => {

                let menu_data = data.menu;
                delete data.menu;
                this.setState({
                    menu_data: this.create_menu(menu_data),
                    site_data: data,
                    site_loaded: true
                });
            }).catch(error => {
                this.handleAjaxException(error)
            });
    };

    handleAjaxResponse = (resp) => {
        // Todo have this method run for all ajax calls,
        // Todo have this method check for code 500 / 401 / 404 etc...
        let result;
        switch (resp.status) {
            case 200:
                result = resp.json();
                break;

            case 400:
                if (resp.headers.map['content-type'].startsWith("application/json")) {
                    result = resp.json();
                } else {
                    result = {
                        success: false,
                    };
                }
                resp.text().then((text) => {
                    this.growl.show({
                        severity: "error",
                        summary: "Bad Request",
                        detail: text,
                    })
                });
                break;
            case 401:
            case 403:
                if (resp.headers.map['content-type'].startsWith("application/json")) {
                    result = resp.json();
                } else {
                    result = {
                        success: false,
                        message: "Permission denied"
                    };
                }
                this.growl.show({
                    severity: "error",
                    summary: "Permission denied",
                    detail: "You have no permission to see this resource."
                });
                break;
            case 500:
                if (resp.headers.map['content-type'].startsWith("application/json")) {
                    result = resp.json();
                } else {
                    result = {
                        success: false,
                        message: "Internal Error"
                    };
                }
                this.growl.show({
                    severity: "error",
                    summary: "Internal Error",
                    detail: "Lino has experienced an internal server error, please contact the system administer if" +
                    "the problem persists after reloading the page.",
                    sticky: true,
                });
                break;
            default:
                console.log("Unknown status code");
                result = resp.json();
        }
        return result
    };

    handleAjaxException = (error) => {
        console.error(error);
        this.growl.show({
            severity: "error",
            summary: "Error",
            detail: error.message,
        });
    };
    /**
     * Slighly hacky solution for running actions.
     * Called by eval'd js from the server in html elems, as well as internall for navigation.
     *
     * Has only basic suport for navigation
     * @param an, string, name of action
     * @param actorId ID for actor, in . notation ie: tickets.AllTickets
     * @param rp instance that's running the action, grid / detail component
     * @param status uses keys: record_id, mk and mt for navigation data,
     */
    runAction = ({an, actorId, rp, status, sr, response_callback} = {}) => {

        // have rp be the key for the rp
        // have rp_obj be the instance
        // the rp argument can be either,

        let rp_obj;
        if (typeof rp === "string") {
            rp_obj = this.rps[rp];
        } else if (rp) { // if required as rp can be undefined or null
            rp_obj = rp;
            rp = key(rp_obj);
        }

        rp_obj && rp_obj.save && an !== "submit_detail" && rp_obj.save(); // auto save

        const action = this.state.site_data.actions[an];
        // console.log("runAction", action, an, actorId, rp, status, sr);
        // Grid show and detail actions change url to correct page.
        let url_args = queryString.parse(this.router.history.location.search);
        let rqdata, xcallback;
        if (status) {
            rqdata = status.rqdata;
            xcallback = status.xcallback;
            delete status.rqdata;
            delete status.xcallback;
        }
        let excecute_args = {
            an: an,
            action: action,
            actorId: actorId,
            rp: rp,
            rp_obj: rp_obj,
            status: status,
            sr: sr,
            response_callback: response_callback,
            data: {},
            rqdata: rqdata, // responce data to use used (from confirmation dialog)
            xcallback: xcallback // confirmation callback token
        };

        if (rqdata && xcallback) {
            return this.excuteAction(excecute_args) // skip preprocessing of action, already done in past request
        }

        if (status && status.base_params) {
            status.base_params.mt && (excecute_args.mk = status.base_params.mk);
            status.base_params.mk && (excecute_args.mt = status.base_params.mt);
        }
        if (an === "grid" || an === "show" || an === "detail") {
            ActorData.prototype.getData(actorId, (actorData) => {
                let history_conf = {
                    pathname: `/api/${actorId.split(".").join("/")}/`,
                    search: {} // url params
                };
                if (an === "detail") {

                    history_conf.pathname += `${status.record_id !== undefined ? status.record_id : sr[0]}`
                }

                status.base_params && status.base_params.mk && (history_conf.search.mk = status.base_params.mk);
                status.base_params && status.base_params.mt && (history_conf.search.mt = status.base_params.mt);

                status.param_values && (history_conf.search.pv = pvObj2array(status.param_values, actorData.pv_fields));
                // Convert to string (Needed for array style PV values)
                history_conf.search = queryString.stringify(history_conf.search);

                this.router.history.push(history_conf);
            });
        }
        else if (action.window_action) {
            // dialog action:
            let diag_props = {
                an: an,
                action: action,
                actorId: actorId,
                data: {},
                action_dialog: an !== "insert", // insert windows use normal choice API
                originalData: {},
                isClosable: (linoDialog) => {
                    if (deepCompare(linoDialog.props.data, linoDialog.props.originalData)) {
                        return true; // no change, just close
                    }
                    else {
                        this.askToCloseDialog({ParentlinoDialog: linoDialog});
                    }
                },
                onClose: () => {
                    // console.log("Action Dialog Closed Callback");
                    this.setState((old) => {
                        let diags = old.dialogs.filter((x) => x !== diag_props);
                        if (diags.length === 0 && rp_obj && rp_obj.reload) rp_obj.reload();
                        return {dialogs: diags};
                        // splice d out
                        //return {dialogs: [...ds]
                    });
                },
                onOk: () => {
                    excecute_args.data = diag_props.data;
                    this.excuteAction(excecute_args);
                    // console.log("Action Dialog OK Callback")
                },
                //LinoDialog defines a default footer using linoBbar for insert
                footer: an === "insert" ? undefined : <div>
                    <Button label={"OK"} onClick={() => {
                        diag_props.onOk();
                    }}/>
                    <Button label={"Cancel"} className={"p-button-secondary"} onClick={() => {
                        diag_props.onClose();
                    }}/>
                </div>
            };

            if (status.data_record) {
                diag_props.data = status.data_record.data;
                diag_props.originalData = {...status.data_record.data}; // make copy
                diag_props.title = status.data_record.title;
            }
            else if (status.field_values) {
                diag_props.data = status.field_values;
                diag_props.originalData = {...status.field_values}; // make copy
            }
            else if (an === "insert") { // no default data and insert action,

                // fetch default data
                // Might be only for insert,
                let args = {an: an, fmt: "json", rp: rp};
                if (url_args.mk) args.mk = url_args.mk; // in the case of expanded slave-grid or detail
                if (url_args.mt) args.mt = url_args.mt;
                // I wonder if we should call on rp to get the mt / mk...

                // /api/comments/CommentsByRFC/-99999?_dc=1548148980130&mt=31&mk=2542&an=insert&rp=ext-comp-1376&fmt=json
                // gets default values for this insert
                fetchPolyfill(`/api/${actorId.replace(".", "/")}/-99999?${queryString.stringify(args)}`).then(
                    this.handleAjaxResponse).then(
                    (data) => {
                        // console.log(data);
                        this.setState(old => {
                            let dialogs = old.dialogs,
                                dialog = dialogs.find(e => e === diag_props); // find dialog
                            dialogs = [...dialogs]; // make copy of array, to trigger a rerender.
                            // Object.assign(prevState.data, {...values}
                            if (dialog.data.mk) data.data.mk = dialog.data.mk;
                            if (dialog.data.mt) data.data.mt = dialog.data.mt;
                            dialog.data = data.data;
                            dialog.originalData = {...data.data};
                            dialog.title = data.title;
                            return {dialogs: dialogs}
                        })
                    }
                ).catch(error => this.handleAjaxException(error));
            }

            if (url_args.mk) diag_props.data.mk = url_args.mk; // in the case of expanded slave-grid or detail
            if (url_args.mt) diag_props.data.mt = url_args.mt;
            if (status.base_params) {
                status.base_params.mk && (diag_props.data.mk = status.base_params.mk,
                    diag_props.originalData.mk = status.base_params.mk);
                status.base_params.mt && (diag_props.data.mt = status.base_params.mt,
                    diag_props.originalData.mt = status.base_params.mt);

            }

            // fetch( default data for action url, for both insert + actions)
            // .then( req => req.json()).
            //  then(
            this.setState((old) => {
                return {dialogs: [diag_props].concat(old.dialogs)}
            })
        }
        // Other actions require an ajax call
        else {
            this.excuteAction(excecute_args);
        }
    };

    add_su = (obj) => {
        this.state.su_id && (obj['su'] = this.state.su_id);
    };

    excuteAction = ({an, action, actorId, rp, rp_obj, status, sr, response_callback, data, rqdata, xcallback} = {}) => {
        let urlSr = Array.isArray(sr) ? sr[0] : sr, // if array, first item, if undefined, blank
            args = {
                an: an,
                sr: sr, // not needed for submit_detail, but non breaking, so leave it.
            };

        // add sub user id
        this.add_su(args);

        rp && (args.rp = rp);
        // filter out changes fields, only submit them. Reason being we have no way to filter for editable fields...

        if (action.submit_form_data) {
            // delete args.fmt; // fmt:"json" causes parseing error for DateFieldElements
            // save action button
            let changes = Object.keys(rp_obj.state.data).filter((value, index) => rp_obj.state.original_data[value] !== rp_obj.state.data[value]).reduce((result, item, index, array) => {
                let value = rp_obj.state.data[item];
                if (value === null) value = "";
                if (value.toJSON) value = value.toJSON(); // Date Objects
                result[item] = value;
                return result
            }, {});
            Object.assign(args, changes);
        }


        if (an === "submit_insert") {
            //called from an action button rather than OK / cancel buttons
            Object.assign(args, rp_obj.props.data)
        }

        if (data) { // dialog submission
            Object.assign(args, data)
        } // is a dialog object.

        if (action.http_method === "GET") args.fmt = 'json';

        if (action.preprocessor) {
            let func = eval(action.preprocessor);
            func && func(rp_obj, args);
        }

        if (an === "submit_insert" && rp_obj.state.FileUploadRequest) {
            // We have file upload
            let {xhr, formData} = rp_obj.state.FileUploadRequest;
            Object.keys(args).forEach(
                (name) => args[name] != null && formData.append(name, args[name]));
            xhr.lino_callbackdata = {rp: rp_obj || rp, response_callback: response_callback};
            xhr.send(formData);
            return
        }

        let makeCall = () => {
            let url = `api/${actorId.split(".").join("/")}`;
            if (urlSr !== undefined && urlSr !== null) url += `/${urlSr}`;
            if (action.http_method === "GET") url += `?${queryString.stringify(args)}`;

            fetchPolyfill(url, {
                method: action.http_method,
                body: ['POST', "PUT"].includes(action.http_method) ? new URLSearchParams(queryString.stringify(args))/* objectToFormData(args)  *//*JSON.stringify(args)*/ : undefined,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',// 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }).then(
                this.handleAjaxResponse
            ).then((data) => {
                    this.handleActionResponse({
                        response: data,
                        rp: rp_obj || rp,
                        response_callback: response_callback
                    });
                }
            ).catch(error => window.App.handleAjaxException(error));
            // console.warn(`Unknown action ${an} on actor ${actorId} with status ${JSON.stringify(status)}`);
        };

        if (rqdata && xcallback) {
            Object.assign(args, rqdata);
            args["xcallback__" + xcallback.xcallback_id] = xcallback.choice;
            makeCall();
            return
        }

        if (status && status.fv !== undefined) {
            Object.assign(args, {'fv': status.fv})
        }
        if (an === "grid_put" || an === "grid_post") {
            let {editingValues} = rp_obj.state;
            let values = {};
            ActorData.prototype.getData(actorId, (actorData) => {
                Object.keys(editingValues).sort().forEach(function (k, i) {
                    let col = actorData.col.find(col => col.fields_index == k);
                    if (col === undefined) {
                        col = actorData.col.find(col => col.fields_index + 1 == k);
                    }
                    if (col !== undefined) { // last two items are disabled fields and isEditable bool, without cols.
                        values[values[col.name] === undefined ? col.name : col.name + "Hidden"] = editingValues[k];
                    }
                });
                if (status.base_params) {
                    status.base_params.mt && (values.mk = status.base_params.mk);
                    status.base_params.mk && (values.mt = status.base_params.mt);
                }
                Object.assign(args, values)
                makeCall();
            });
        } else {
            makeCall();
        }
    };

    handleActionResponse = ({response = response, rp = undefined, response_callback = undefined,}) => {
        // console.log(response, rp);

        if (response_callback) { // callback from run_action for doing something extra with req data.
            response_callback(response);
        }

        if (response.xcallback) { // confirmation dialogs
            let {id, buttons, title} = response.xcallback,
                url = `/callbacks/${id}/`,

                diag_props = {
                    onClose: () => { // close dialog after doing callback
                        this.setState((old) => {
                            let diags = old.dialogs.filter((x) => x !== diag_props);
                            return {dialogs: diags};
                        });
                    },
                    closable: false,
                    footer:
                        <div> {buttons.map((button) =>
                            <Button key={button[0]} className={"p-button-secondary"} label={button[1]} onClick={() => {
                                diag_props.onClose();
                                // window.App.response_callbacks
                                eval(response.xcallback[button[0] + "_resendEvalJs"]);
                                // WARNING, no longer preserves response_callback, as eval runs the action from window, not detail/grid...
                            }}/>
                        )} </div>,
                    title: title,
                    content: <div dangerouslySetInnerHTML={{__html: response.message}}></div>
                };


            // push to dialog buffer
            this.setState((old) => {
                return {dialogs: [diag_props].concat(old.dialogs)}
            });
            return // Dont want any further response handeling
        }

        if (response.eval_js) {
            eval(response.eval_js);
        }

        if (response.record_deleted && response.success) {
            this.growl.show({
                // severity: "error",
                severity: "success",
                summary: "Success",
                detail: "Record Deleted"
            });
            this.router.history.goBack(); // looking at empty recrod, go back!
        }
        if (response.success && response.goto_url === "/" && response.close_window) {
            // Sign-in action success
            document.querySelector('#sign_in_submit').submit();
            // sign_in_submit
            // window.location.reload();
            this.fetch_user_settings();
            this.dashboard && this.dashboard.reloadData();
        }

        if (response.close_window) {
            if (this.state.dialogs) {
                this.state.dialogs[this.state.dialogs.length - 1] && this.state.dialogs[this.state.dialogs.length - 1].onClose();

                    this.setState((old) => {
                    old.dialogs.pop();  // remove last item, use shift for first
                    if (rp && rp.reload && old.dialogs.length === 0) rp.reload();
                    return {dialogs: [...old.dialogs]}
                })
            }
        }

        if (response.goto_url) {
            this.router.history.push(response.goto_url);
        }

        if (response.open_url) {
            window.open(response.open_url, 'foo', ""); // From extjs, unsure why `"foo", ""`
        }

        if (response.message) {
            this.growl.show({
                // severity: "error",
                severity: response.alert ? response.alert.toLowerCase() : response.success ? "success" : "info",
                summary: response.alert || (response.success ? "Success" : "Info"),
                detail: response.message
            })
        }

        if (response.refresh || response.refresh_all) {
            if (rp && rp.rp.includes("dashboard") && rp.rp !== 'dashboard-main') {
                this.rps['dashboard-main'].reload(); // reloads main dashboard text
            }
            rp && rp.reload();
            if (rp === null) this.dashboard.reloadData();
        }


    };

    /**
     * global search method.
     * @param query: string send to server to fetch thing.
     */
    searchMethod = (query) => {
        // fetchPolyfill()
    };

    /**
     * Converts sitedata menu data into Primereact menu data with functions
     *
     **/
    create_menu = (layout) => {

        const convert = (mi) => {
            let menu = {
                // KEY          TYPE        DEFAULT DESC
                // label	    string	    null	Text of the item.
                label: mi.text,
                // icon	        string	    null	Icon of the item.
                // command	    function	null	Callback to execute when item is clicked.
                command: (event) => {
                    // let action_name = mi.handler.action; // grid.contacts.Persons
                    // action_name = action_name.split("."); // [ "grid", "contacts", "Persons" ]
                    // action_name = action_name.splice(1).concat(action_name).join("/"); // "contacts/Persons/grid/"
                    // action_name = action_name.splice(1).join("/"); // "contacts/Persons"
                    // console.log(mi, event, action_name);
                    // this.router.history.push("/api/" + action_name);
                    // console.log(this.router);
                    eval(mi.handler);
                }
                // url	        string	    null	External link to navigate when item is clicked.
                // items	    array	    null	An array of children menuitems.

                // disabled	    boolean	    false	When set as true, disables the menuitem.
                // target	    string	    null	Specifies where to open the linked document.
                // separator	boolean	    false	Defines the item as a separator.
                // style	    object	    null	Inline style of the menuitem.
                // className	string	    null	Style class of the menuitem.
            };
            if (mi.menu && mi.menu.items) {
                menu.items = mi.menu.items.map(mi => convert(mi));
                delete menu.command; // Only have command on submenu items,
            }
            return menu;
        };
        let result = layout.map(mi => convert(mi));
        // console.log(result);
        return result
    };

    showTopDialog() {
        let topDiagProps = window.App.state.dialogs.length[window.App.state.dialogs.length - 1];
        if (topDiagProps === undefined) {
            return
        }
        let topLinoDialog = window.App.dialogRefs[key(topDiagProps)];
        topLinoDialog && topLinoDialog.dialog && topLinoDialog.dialog.show()

    }

    askToCloseDialog({ParentlinoDialog = undefined,} = {}) {
        let diag_props = {
            onClose: (diag, closeParent) => { // acts as a cancel
                this.setState((old) => {
                    let diags = old.dialogs.filter((x) => x !== diag_props);
                    return {dialogs: diags};
                });
                !closeParent && ParentlinoDialog && ParentlinoDialog.dialog.show();

            },
            closeOnEscape: true,
            closable: true,
            footer: <div>
                <Button label={"yes"} onClick={() => {
                    // window.App.dialogRefs[key(diag_props)].dialog.unbindMaskClickListener();
                    // window.App.dialogRefs[key(diag_props)].dialog.unbindGlobalListeners();
                    diag_props.onClose(undefined, "closeParent");
                    // ParentlinoDialog && ParentlinoDialog.dialog.unbindMaskClickListener();
                    // ParentlinoDialog && ParentlinoDialog.dialog.unbindGlobalListeners();
                    ParentlinoDialog && ParentlinoDialog.props.onClose();
                    // setTimeout(() => {
                    //     this.showTopDialog();
                    // }, 50)
                }}/>
                <Button className={"p-button-secondary"} label={"no"} onClick={() => {
                    window.App.dialogRefs[key(diag_props)].dialog.unbindMaskClickListener();
                    window.App.dialogRefs[key(diag_props)].dialog.unbindGlobalListeners();
                    diag_props.onClose();
                }}/>
            </div>,
            title: "Confirmation",
            content: <div>Discard changes to current record?</div>
        };
        // push to dialog stack
        this.setState((old) => {
            return {dialogs: [diag_props].concat(old.dialogs)}
        });
    }

    render() {
        let wrapperClass = classNames('layout-wrapper', {
            'layout-overlay': this.state.layoutMode === 'overlay',
            'layout-static': this.state.layoutMode === 'static',
            'layout-static-sidebar-inactive': this.state.staticMenuInactive && this.state.layoutMode === 'static',
            'layout-overlay-sidebar-active': this.state.overlayMenuActive && this.state.layoutMode === 'overlay',
            'layout-mobile-sidebar-active': this.state.mobileMenuActive
        });
        let sidebarClassName = classNames("layout-sidebar", {'layout-sidebar-dark': this.state.layoutColorMode === 'dark'});
        // console.log("app_re-render");
        return (
            <HashRouter ref={(el) => this.router = el}>
                <div className={wrapperClass} onClick={this.onWrapperClick} ref={el => this.topDiv = el}>
                    <AppTopbar onToggleMenu={this.onToggleMenu} onHomeButton={this.onHomeButton}
                               WS={this.state.WS}
                               useChat={this.state.user_settings && this.state.user_settings.logged_in && window.Lino && window.Lino.useChats}
                               onChatButton={this.onChatButton}
                        // searchValue={this.state.searchValue}
                        // searchMethod={}
                        // searchSuggestions={}
                    />
                    <div ref={(el) => this.sidebar = el} className={sidebarClassName} onClick={this.onSidebarClick}>
                        <ScrollPanel ref={(el) => this.layoutMenuScroller = el} style={{height: '100%'}}>
                            <div className="layout-sidebar-scroll-content">
                                {/*<div className="layout-logo">*/}
                                {/*<img alt="Logo" src={logo}/>*/}
                                {/*</div>*/}
                                {/*<AppInlineProfile/>*/}
                                {this.state.site_loaded ?
                                    <div>
                                        <AppInlineProfile username={this.state.user_settings.username}
                                                          logged_in={this.state.user_settings.logged_in}
                                                          authorities={this.state.user_settings.authorities}
                                                          onActAsSelf={() => this.onAuthoritiesSelect([undefined])}
                                                          su_id={this.state.su_id}
                                                          su_name={this.state.user_settings.su_name}
                                                          act_as_subtext={this.state.user_settings.act_as_subtext}
                                                          act_as_title_text={this.state.user_settings.act_as_title_text}
                                                          act_as_button_text={this.state.user_settings.act_as_button_text}
                                                          act_as_self_text={this.state.user_settings.act_as_self_text}
                                                          act_as_self_text={this.state.user_settings.act_as_self_text}
                                                          onAuthoritiesSelect={this.onAuthoritiesSelect}
                                                          my_setting_text={this.state.user_settings.my_setting_text}
                                                          onSignOutIn={(e) => this.onSignOutIn(e)}
                                                          authAppendTo={this.topDiv}
                                                          onMysettings={(e) => this.onMysettings(e)}/>

                                        <AppMenu model={this.state.menu_data}
                                                 onMenuItemClick={this.onMenuItemClick}/>
                                    </div>
                                    :
                                    <ProgressSpinner/>
                                }
                                {/*<DataProvider endpoint="ui/menu"
                                          render={(data) =>
                                          }
                            />*/}

                            </div>
                        </ScrollPanel>

                        {/*<Sidebar visible={this.state.visible} onHide={(e) => this.setState({visible: false})}>*/}
                        {/*<div className="layout-sidebar-scroll-content">*/}
                        {/*</div>*/}
                        {/*</Sidebar>*/}


                    </div>
                    <div className="layout-main">
                        <Growl ref={(el) => this.growl = el}/>

                        <Route exact path="/" render={(match) => (
                            <DashboardItems ref={(el) => {
                                this.dashboard = el;
                                this.setRpRef(el)
                            }}
                                            dashboard_items={this.state.user_settings ? this.state.user_settings.dashboard_items : 0}
                                            user={this.state.user_settings ? this.state.user_settings.username : "notloaded"}
                            />
                        )}/>
                        <SiteContext.Provider value={this.state.site_data}>
                            {/*<Route path="/api/:packId/:actorId/:actionId" component={Actor}/>*/}
                            <Route path="/api/:packId/:actorId" render={(route) => {
                                let parms = new URLSearchParams(route.location.search);
                                // console.log(key);

                                // todo have 404 be inside Actor?
                                // if (this.state.site_loaded && this.state.site_data.actors[[route.match.params.packId, route.match.params.actorId].join(".")] === undefined) {
                                //     return <div><h1>Not found</h1><p>The Actor you have requested does not exist.</p>
                                //     </div>;
                                // }

                                return this.state.site_loaded ? <Actor match={route}
                                                                       actorId={route.match.params.actorId}
                                                                       packId={route.match.params.packId}
                                                                       mk={parms.get("mk")}
                                                                       mt={parms.get("mt")}
                                        // makes react recreate the LinoGrid instance
                                                                       su={this.state.user_settings.su_name}
                                                                       key={route.match.params.packId + "." + route.match.params.actorId + "." + this.state.user_settings.su_name}

                                        // Should it look at SiteContext?
                                        //                                actorData={this.state.site_data.actors[[route.match.params.packId, route.match.params.actorId].join(".")]}
                                    />
                                    : <ProgressSpinner/>
                            }}/>
                        </SiteContext.Provider>
                    </div>

                    <SiteContext.Provider value={this.state.site_data}>

                        <div className="layout-mask"/>
                        {/*this is for auth*/}
                        <iframe id="temp" name="temp" style={{display: "none"}}/>
                        {/*<SignInDialog visible={this.state.logging_in} onClose={() => this.setState({logging_in: false})}*/}
                        {/*onSignIn={this.onSignIn}/>*/}
                        {this.state.dialogs.map((d) => (<ActorData key={key(d)} actorId={d.actorId}>
                                <LinoDialog {...d}
                                            action={d.action} actorId={d.actorId} key={key(d)}
                                            onClose={d.onClose} onOk={d.onOk} data={d.data} title={d.title}
                                            content={d.content}
                                            isClosable={d.isClosable}
                                            closable={d.closable}
                                            footer={d.footer}
                                            router={this.router}
                                            update_value={(values, id) => {
                                                this.setState(previous => {
                                                    const dia = previous.dialogs.find(e => key(e) === id),

                                                        dialogs = [...previous.dialogs];
                                                    Object.assign(dia.data, values);
                                                    return {dialogs: dialogs}
                                                })
                                            }}
                                            ref={(el) => {
                                                this.dialogRefs[key(d)] = el
                                            }}

                                />

                            </ActorData>
                        ))}
                    </SiteContext.Provider>

                    {this.state.user_settings && this.state.user_settings.logged_in
                    && window.Lino && window.Lino.useChats &&
                    <React.Fragment>
                        <OverlayPanel dismissable={false} showCloseIcon={true} ref={(el) => this.chatOp = el} style={{
                            marginRight: "-10px", position: "absolute"
                        }}>
                            <div ref={el => this.GroupChatChooserMountPoint = el}/>

                        </OverlayPanel>
                        <LinoChats
                            //opened={this.state.chatOpen} // timestamp for reloading
                            chatsUnseenBadgeMountPoint={this.chatButton}
                            groupChatChooserMountPoint={this.GroupChatChooserMountPoint}
                            sendChat={this.sendChat}
                            sendSeenAction={this.sendSeenAction}
                            OpenConversation={this.OpenConversation}
                            openedconversations={this.state.openedconversations}
                            ref={(el) => this.LinoChats = el}
                        /></React.Fragment>}
                </div>

            </HashRouter>
        )
    }
}

const wrapper = document.getElementById("root");

wrapper ? ReactDOM.render(<App/>, wrapper) : null;


import * as serviceWorker from './serviceWorker';

serviceWorker.register();
