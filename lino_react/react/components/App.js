import classNames from 'classnames';
import React from "react";
import ReactDOM from "react-dom";
import DataProvider from "./DataProvider";
import Table from "./Table";
import Menu from "./Menu";
import {Sidebar} from 'primereact/sidebar';
import {PanelMenu} from 'primereact/panelmenu';
import {ScrollPanel} from 'primereact/components/scrollpanel/ScrollPanel';
import {AppMenu} from './AppMenu';
import {AppTopbar} from './AppTopbar';
import {ProgressSpinner} from 'primereact/progressspinner';

import 'primereact/resources/themes/nova-light/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import './layout/layout.css';
import './App.css';
import queryString from "query-string";

window.Table = Table;

class App extends React.Component {

    constructor() {
        super();
        this.state = {
            visible: true,
            layoutMode: 'static',
            layoutColorMode: 'dark',
            staticMenuInactive: false,
            overlayMenuActive: false,
            mobileMenuActive: true,

            site_loaded: false,
            site_data: null,
            menu_data: null,
            user_settings:null
        };

        this.onWrapperClick = this.onWrapperClick.bind(this);
        this.onToggleMenu = this.onToggleMenu.bind(this);
        this.onSidebarClick = this.onSidebarClick.bind(this);
        this.onMenuItemClick = this.onMenuItemClick.bind(this);

        this.fetch_user_settings();

        window.App = this;
        console.log(window, window.App);
    }

    onWrapperClick(event) {
        if (!this.menuClick) {
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
        fetch("/user/settings/").then( response => {
            return response.json();
        }
        ).then( (data) => {
            this.setState({user_settings: data});
            return this.fetch_site_data(data.site_data);
            }
        )
    };

    fetch_site_data = (uri) => {
        return fetch(uri)
            .then(response => {
                if (response.status !== 200) {
                    return this.setState({placeholder: "Something went wrong"});
                }
                return response.json();
            })
            .then(data => {

                let menu_data = data.menu;
                delete data.menu;
                this.setState({menu_data: this.create_menu(menu_data),
                               site_data: data,
                               site_loaded: true});
            })
    };

    /**
     * Converts
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
                    console.log(mi, event)
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
                menu.items = mi.menu.items.map(mi => convert(mi))
            }
            return menu;
        };
        let result = layout.map(mi => convert(mi));
        console.log(result);
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
        return (
            <div className={wrapperClass} onClick={this.onWrapperClick}>
                <AppTopbar onToggleMenu={this.onToggleMenu}/>
                <div ref={(el) => this.sidebar = el} className={sidebarClassName} onClick={this.onSidebarClick}>
                    <ScrollPanel ref={(el) => this.layoutMenuScroller = el} style={{height: '100%'}}>
                        <div className="layout-sidebar-scroll-content">
                            {/*<div className="layout-logo">*/}
                            {/*<img alt="Logo" src={logo}/>*/}
                            {/*</div>*/}
                            {/*<AppInlineProfile/>*/}
                            {this.state.site_loaded ?
                                <AppMenu model={this.state.menu_data}
                                         onMenuItemClick={this.onMenuItemClick}/>
                                :
                                <ProgressSpinner />
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
                    <DataProvider endpoint="api/tickets/AllTickets"
                                  post_data={(data) => data.rows.map(row => {
                                      row.splice(-2);
                                  })} // Remove Disabled rows & Is editable}
                        // render={(data, Comp) => {
                        //     const TagName = window[Comp];
                        //     return <TagName data={data}/>
                        // }}
                                  render={(data) => <Table data={data.rows}/>}
                    />
                </div>
                <div className="layout-mask"/>
            </div>
        )
    }
}

const wrapper = document.getElementById("root");

wrapper ? ReactDOM.render(<App/>, wrapper) : null;
