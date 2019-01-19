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
import {SignInDialog} from './SignInDialog'
import {Actor} from "./Actor";
//import {LinoGrid} from "./LinoGrid";
import {LinoDialog} from './LinoDialog'


import {Sidebar} from 'primereact/sidebar';
import {PanelMenu} from 'primereact/panelmenu';
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

    constructor() {super();
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

        this.onSignOutIn = this.onSignOutIn.bind(this);
        this.onSignIn = this.onSignIn.bind(this);

        this.handleActionResponce = this.handleActionResponce.bind(this);
        this.runAction = this.runAction.bind(this);

        // this.searchMethod = this.searchMethod.bind(this);

        this.fetch_user_settings();

        window.App = this;
        // console.log(window, window.App);
    }

    onSignOutIn(event) {
        if (!this.state.user_settings.logged_in) {
            this.setState({logging_in: true})
        }
        else {
            fetchPolyfill("/auth").then((req) => {
                this.setState({logging_in: false});
                this.fetch_user_settings();
                this.dashboard.reloadData();

            })
        }

    }

    onSignIn(payload) {
        // event.preventDefault();
        // let payload = {
        //     username: this.state.username,
        //     password: this.state.password
        // };
        let data = Object.keys(payload).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(payload[key])).join('&');
        // let data = new FormData();
        // data.append("json", JSON.stringify(payload));
        // Object.entries(payload).map((k,v) => data.append(k,v));
        this.setState({logging_in: false});
        fetchPolyfill("/auth",
            {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                method: "POST",
                body: data
            }
        ).then((res) => (res.json())
        ).then((data) => {
            if (data.success) {
                this.fetch_user_settings();
                this.dashboard.reloadData();

            }
        });

    }

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
        )
    };

    fetch_site_data = (uri) => {
        return fetchPolyfill(uri)
            .then(response => {
                if (response.status !== 200) {
                    return this.setState({placeholder: "Something went wrong"});
                }
                return response.json();
            })
            .then(data => {

                let menu_data = data.menu;
                delete data.menu;
                this.setState({
                    menu_data: this.create_menu(menu_data),
                    site_data: data,
                    site_loaded: true
                });
            })
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
    runAction = ({an, actorId, rp, status, sr} = {}) => {

        const action = this.state.site_data.actors[actorId].ba[an];
        console.log("runAction",action, an, actorId, rp, status, sr);
        // Grid show and detail actions change url to correct page.
        if (an === "grid" || an === "show" || an === "detail") {
            let history_conf = {
                pathname: `/api/${actorId.split(".").join("/")}/`,
                search: {}
            };
            if (an === "detail") {
                history_conf.pathname += `${status.record_id ? status.record_id : ""}`
            }


            status.base_params && status.base_params.mk && (history_conf.search.mk = status.base_params.mk);
            status.base_params && status.base_params.mt && (history_conf.search.mt = status.base_params.mt);
            // Convert to string (Needed for array style PV values)
            history_conf.search = queryString.stringify(history_conf.search);

            this.router.history.push(history_conf);

        }
        else if (action.window_action) {
            // dialog action:
            this.setState((old) => {return {dialogs: [{
                an:an,
                action:action,
                actorId:actorId,
                data: status.data_record.data,
                title:status.data_record.title,
                onClose: () => {console.log("Action Dialog Closed Callback")},
                onOk: () => {console.log("Action Dialog OK Callback")},
            }].concat(old.dialogs)}})
        }
        // Other actions require an ajax call
        else {

            let urlSr = Array.isArray(sr) ? sr[0] : sr,
                args = {
                    an: an,
                    sr: sr,

                };
            rp && (args.rp = typeof rp === "string" ? rp : key(rp)); // rp can be null / undefined, in that case don't pass
            fetchPolyfill(`api/${actorId.split(".").join("/")}/${urlSr}?${queryString.stringify(args)}`).then(
                (req) => {
                    //Todo error handeling.
                    return req.json()
                }
            ).then((data) => {
                    this.handleActionResponce({response: data, rp: typeof rp === "string" ? window.App.rps[rp] : rp});
                }
            );
            // console.warn(`Unknown action ${an} on actor ${actorId} with status ${JSON.stringify(status)}`);
        }
    };

    handleActionResponce = ({response, rp = undefined}) => {
        // console.log(response, rp);
        if (response.eval_js) {
            eval(response.eval_js);
        }

        if (response.message) {
            this.growl.show({
                // severity: "error",
                severity: response.alert.toLowerCase(),
                summary: response.alert,
                detail: response.message
            })
        }

        if (response.refresh) {
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
                    <AppTopbar onToggleMenu={this.onToggleMenu}
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
                        {this.state.site_loaded ?
                            <SiteContext.Provider value={this.state.site_data}>
                                <React.Fragment>
                                    {/*<Route path="/api/:packId/:actorId/:actionId" component={Actor}/>*/}
                                    <Route path="/api/:packId/:actorId" render={(route) => {
                                        let key = route.match.params.packId + "." + route.match.params.actorId;
                                        let parms = new URLSearchParams(route.location.search);
                                        // console.log(key);
                                        return <Actor match={route}
                                                      actorId={route.match.params.actorId}
                                                      packId={route.match.params.packId}
                                                      mk={parms.get("mk")}
                                                      mt={parms.get("mt")}
                                            // makes react recreate the LinoGrid instance
                                                      key={key}

                                            // Should it look at SiteContext?
                                                      actorData={this.state.site_data.actors[[route.match.params.packId, route.match.params.actorId].join(".")]}/>
                                    }}
                                    />
                                </React.Fragment>
                            </SiteContext.Provider>
                            :
                            <ProgressSpinner/>
                        }
                    </div>
                    <div className="layout-mask"/>
                    <SignInDialog visible={this.state.logging_in} onClose={() => this.setState({logging_in: false})}
                                  onSignIn={this.onSignIn}/>
                    {this.state.dialogs.map((d) => {

                        return <LinoDialog action={d.action} actorId={d.actorId} key={key(d)}
                                onClose={d.onClose} onOk={d.onOk} title={d.title} router={this.router}/>

                    })}

                </div>
            </HashRouter>
        )
    }
}

const wrapper = document.getElementById("root");

wrapper ? ReactDOM.render(<App/>, wrapper) : null;
