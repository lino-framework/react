import React, {Component} from 'react';
import {InputText} from 'primereact/inputtext';
import PropTypes from 'prop-types';
import {BrowserRouter as Router, HashRouter, Route, Link} from "react-router-dom";

export class AppTopbar extends Component {

    static defaultProps = {
        onToggleMenu: null
    }

    static propTypes = {
        onToggleMenu: PropTypes.func.isRequired
    }

    render() {
        return (
            <div className="layout-topbar clearfix">
                <a className="layout-menu-button" onClick={this.props.onToggleMenu}>
                    <span className="pi pi-bars"/>
                </a>
                <Link className="layout-home-button" to="/">
                    <span className="pi pi-home"/>
                </Link>
                <div className="layout-topbar-icons">
                    <span className="layout-topbar-search">
                        <InputText type="text" placeholder="Search"/>
                        <span className="layout-topbar-search-icon pi pi-search"/>
                    </span>
                    <a>
                        <span className="layout-topbar-item-text">Events</span>
                        <span className="layout-topbar-icon pi pi-calendar"/>
                        <span className="layout-topbar-badge">5</span>
                    </a>
                    <a>
                        <span className="layout-topbar-item-text">Settings</span>
                        <span className="layout-topbar-icon pi pi-cog"/>
                    </a>
                    <a>
                        <span className="layout-topbar-item-text">User</span>
                        <span className="layout-topbar-icon pi pi-user"/>
                    </a>
                </div>
            </div>
        );
    }
}