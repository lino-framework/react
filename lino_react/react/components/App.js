import React from "react";
import ReactDOM from "react-dom";

import key from "weak-key";

import classNames from 'classnames';
import queryString from "query-string"

import DataProvider from "./DataProvider";
import Table from "./Table";
import Menu from "./Menu";
import {AppMenu} from './AppMenu';
import {AppTopbar} from './AppTopbar';
import {AppInlineProfile} from "./AppInlineProfile"
// import {SignInDialog} from './SignInDialog'
import {Actor} from "./Actor";
//import {LinoGrid} from "./LinoGrid";
import {LinoDialog} from './LinoDialog'
import LinoBbar from "./LinoBbar";
// import {objectToFormData} from "./LinoUtils"


import {Sidebar} from 'primereact/sidebar';
import {PanelMenu} from 'primereact/panelmenu';
import {Button} from 'primereact/button';
import {ScrollPanel} from 'primereact/components/scrollpanel/ScrollPanel';
//import {OverlayPanel} from 'primereact/overlaypanel';
import {ProgressSpinner} from 'primereact/progressspinner';
import {Growl} from 'primereact/growl';

import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

import './layout/layout.css';
import './App.css';


import {BrowserRouter as Router, HashRouter, Route, Link} from "react-router-dom";

import {Redirect} from 'react-router-dom';

import {fetch as fetchPolyfill} from 'whatwg-fetch'


import {SiteContext} from "./SiteContext"


class App extends React.Component {

    constructor() {
        super();
        this.state = {
            visible: true,
            layoutMode: 'static',
            layoutColorMode: 'dark',
            staticMenuInactive: false,
            overlayMenuActive: true,
            mobileMenuActive: true,

            site_loaded: false,
            site_data: null,
            menu_data: null,
            user_settings: null,

            logging_in: false,

            dialogs: [],
            // Topbar states // Disabled until global search api documentation is found.
            // searchValue: "",
            // searchSuggestions: []

        };

        this.rps = {}; // used for rp

        this.onWrapperClick = this.onWrapperClick.bind(this);
        this.onToggleMenu = this.onToggleMenu.bind(this);
        this.onSidebarClick = this.onSidebarClick.bind(this);
        this.onMenuItemClick = this.onMenuItemClick.bind(this);

        this.onHomeButton = this.onHomeButton.bind(this);

        this.onSignOutIn = this.onSignOutIn.bind(this);
        // this.onSignIn = this.onSignIn.bind(this);

        this.handleActionResponse = this.handleActionResponse.bind(this);
        this.runAction = this.runAction.bind(this);

        // this.searchMethod = this.searchMethod.bind(this);

        this.fetch_user_settings();

        window.App = this;
        // console.log(window, window.App);
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
                    "field_values": {"password": "", "username": ""},
                    "fv": ["", ""],
                }
            })
        }
        else {
            // log_out
            fetchPolyfill("/auth").then((req) => {
                this.setState({logging_in: false});
                this.fetch_user_settings();
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

    setRpRef(el) {
        if (el) {
            let rp = key(el);
            window.App.rps[rp] = el;
            el.rp = rp;
        }
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

    fetch_user_settings = () => {
        fetchPolyfill("/user/settings/").then(response => {
                return response.json();
            }
        ).then((data) => {
                this.setState({user_settings: data});
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
        return resp.json();
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
    runAction = ({an, actorId, rp, status, sr, responce_callback} = {}) => {

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
        const action = this.state.site_data.actors[actorId].ba[an];
        console.log("runAction", action, an, actorId, rp, status, sr);
        // Grid show and detail actions change url to correct page.
        let url_args = queryString.parse(this.router.history.location.search);

        let excecute_args = {
            an: an,
            action: action,
            actorId: actorId,
            rp: rp,
            rp_obj: rp_obj,
            status: status,
            sr: sr,
            responce_callback: responce_callback,
            data: {},
        };


        if (an === "grid" || an === "show" || an === "detail") {
            let history_conf = {
                pathname: `/api/${actorId.split(".").join("/")}/`,
                search: {}
            };
            if (an === "detail") {

                history_conf.pathname += `${status.record_id ? status.record_id : sr[0]}`
            }


            status.base_params && status.base_params.mk && (history_conf.search.mk = status.base_params.mk);
            status.base_params && status.base_params.mt && (history_conf.search.mt = status.base_params.mt);
            // Convert to string (Needed for array style PV values)
            history_conf.search = queryString.stringify(history_conf.search);

            this.router.history.push(history_conf);

        }
        else if (action.window_action) {
            // dialog action:
            let diag_props = {
                an: an,
                action: action,
                actorId: actorId,
                data: {},
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
                diag_props.title = status.data_record.title;
            }
            else if (status.field_values) {
                diag_props.data = status.field_values;
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
                fetchPolyfill(`/api/${actorId.replace(".", "/")}/-99999?${queryString.stringify(args)}`).then((req) => req.json()).then(
                    (data) => {
                        // console.log(data);
                        this.setState(old => {
                            let dialogs = old.dialogs,
                                dialog = dialogs.find(e => e === diag_props); // find dialog
                            dialogs = [...dialogs]; // make copy of array, as to triger a refresh of data.
                            // Object.assign(prevState.data, {...values}
                            if (dialog.data.mk) data.data.mk = dialog.data.mk;
                            if (dialog.data.mt) data.data.mt = dialog.data.mt;
                            dialog.data = data.data;
                            dialog.title = data.title;
                            return {dialogs: dialogs}
                        })
                    }
                ).catch(error => window.App.handleAjaxException(error));
            }

            if (url_args.mk) diag_props.data.mk = url_args.mk; // in the case of expanded slave-grid or detail
            if (url_args.mt) diag_props.data.mt = url_args.mt;
            if (status.base_params) {
                status.base_params.mt && (diag_props.data.mk = status.base_params.mk);
                status.base_params.mk && (diag_props.data.mt = status.base_params.mt);

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

    excuteAction = ({an, action, actorId, rp, rp_obj, status, sr, responce_callback, data} = {}) => {
        let urlSr = Array.isArray(sr) ? sr[0] : sr, // if array, first item, if undefined, blank
            args = {
                an: an,
                sr: sr, // not needed for submit_detail, but non breaking, so leave it.
            };
        rp && (args.rp = rp);
        // filter out changes fields, only submit them. Reason being we have no way to filter for editable fields...

        if (action.submit_form_data) {
            // delete args.fmt; // fmt:"json" causes parseing error for DateFieldElements
            // save action button
            let changes = Object.keys(rp_obj.state.data).filter((value, index) => rp_obj.state.original_data[value] !== rp_obj.state.data[value]).reduce((result, item, index, array) => {
                let value = rp_obj.state.data[item];
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
            (req) => {
                return req.json()
            }
        ).then((data) => {
                this.handleActionResponse({
                    response: data,
                    rp: rp_obj || rp,
                    response_callback: responce_callback
                });
            }
        ).catch(error => window.App.handleAjaxException(error));
        // console.warn(`Unknown action ${an} on actor ${actorId} with status ${JSON.stringify(status)}`);
    };

    handleActionResponse = ({response, rp = undefined, response_callback = undefined,}) => {
        // console.log(response, rp);

        if (response_callback) {
            response_callback(response);
        }

        if (response.xcallback) {
            // yes/no Dialog
            let {id, title} = response.xcallback,
                url = `/callbacks/${id}/`,

                diag_props = {
                    onClose: () => {
                        this.setState((old) => {
                            let diags = old.dialogs.filter((x) => x !== diag_props);
                            return {dialogs: diags};
                        });
                    },
                    closable: false,
                    footer: <div>
                        <Button label={response.xcallback.buttons.yes} onClick={() => {
                            // console.log("Dialog OK", diag_props.data);
                            diag_props.onClose();
                            fetchPolyfill(url + "yes").then((req) => req.json()).then(
                                (data) => {
                                    if (data.record_deleted && data.success) {
                                        this.growl.show({
                                            // severity: "error",
                                            severity: "success",
                                            summary: "Success",
                                            detail: "Record Deleted"
                                        });
                                        this.router.history.goBack(); // looking at empty recrod, go back!

                                    }
                                    else {
                                        this.handleActionResponse({
                                            response: data,
                                            rp: rp,
                                            response_callback: response_callback
                                        })
                                    }

                                }
                            ).catch(error => window.App.handleAjaxException(error));
                        }}/>
                        <Button className={"p-button-secondary"} label={response.xcallback.buttons.no} onClick={() => {
                            diag_props.onClose();
                            fetchPolyfill(url + "no").then((req) => req.json()).then(
                                (data) => {
                                }
                            ).catch(error => window.App.handleAjaxException(error));

                        }}/>
                    </div>,
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
                <div className={wrapperClass} onClick={this.onWrapperClick}>
                    <AppTopbar onToggleMenu={this.onToggleMenu} onHomeButton={this.onHomeButton}
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
                                                          onSignOutIn={(e) => this.onSignOutIn(e)}/>
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
                            <DataProvider
                                ref={(el) => {
                                    this.dashboard = el;
                                    this.setRpRef(el)
                                }}
                                endpoint="/api/main_html"
                                render={(data) => <div dangerouslySetInnerHTML={{__html: data.html}}></div>}
                            />
                        )}/>
                        <SiteContext.Provider value={this.state.site_data}>
                            {/*<Route path="/api/:packId/:actorId/:actionId" component={Actor}/>*/}
                            <Route path="/api/:packId/:actorId" render={(route) => {
                                let key = route.match.params.packId + "." + route.match.params.actorId;
                                let parms = new URLSearchParams(route.location.search);
                                // console.log(key);

                                return this.state.site_loaded ? <Actor match={route}
                                                                       actorId={route.match.params.actorId}
                                                                       packId={route.match.params.packId}
                                                                       mk={parms.get("mk")}
                                                                       mt={parms.get("mt")}
                                        // makes react recreate the LinoGrid instance
                                                                       key={key}

                                        // Should it look at SiteContext?
                                                                       actorData={this.state.site_data.actors[[route.match.params.packId, route.match.params.actorId].join(".")]}/>
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
                        {this.state.dialogs.map((d) => {

                            return <LinoDialog action={d.action} actorId={d.actorId} key={key(d)}
                                               onClose={d.onClose} onOk={d.onOk} data={d.data} title={d.title}
                                               content={d.content}
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
                                               }}/>

                        })}
                    </SiteContext.Provider>

                </div>
            </HashRouter>
        )
    }
}

const wrapper = document.getElementById("root");

wrapper ? ReactDOM.render(<App/>, wrapper) : null;
