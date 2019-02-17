import React, {Component} from 'react';
import {AutoComplete} from 'primereact/autocomplete';
import PropTypes from 'prop-types';
import {Link} from "react-router-dom";


export class AppTopbar extends Component {

    static defaultProps = {
        onToggleMenu: null
    };

    static propTypes = {
        onToggleMenu: PropTypes.func.isRequired,
        onHomeButton: PropTypes.func.isRequired,
        // searchValue: PropTypes.func.isRequired,
        // searchMethod: PropTypes.func.isRequired,
        // searchSuggestions: PropTypes.func.isRequired,
    };

    render() {
        return (
            <div className="layout-topbar clearfix">
                <a className="layout-menu-button" onClick={this.props.onToggleMenu}>
                    <span className="pi pi-bars"/>
                </a>
                <a className="layout-home-button" onClick={this.props.onHomeButton}>
                    <span className="pi pi-home"/>
                </a>
                <div className="layout-topbar-icons">
                    {/*<span className="layout-topbar-search">*/}
                        {/*<AutoComplete type="text" placeholder="Search"*/}
                                      {/*value={this.props.searchValue}*/}
                                      {/*completeMethod={(e) => {*/}
                                          {/*this.props.searchMethod(e.query)*/}
                                      {/*}}*/}
                                      {/*suggestions={this.props.searchSuggestions}/>*/}
                        {/*<span className="layout-topbar-search-icon pi pi-search"/>*/}
                    {/*</span>*/}
                    {/*<a>*/}
                    {/*<span className="layout-topbar-item-text">Events</span>*/}
                    {/*<span className="layout-topbar-icon pi pi-calendar"/>*/}
                    {/*<span className="layout-topbar-badge">5</span>*/}
                    {/*</a>*/}
                    {/*<a>*/}
                    {/*<span className="layout-topbar-item-text">Settings</span>*/}
                    {/*<span className="layout-topbar-icon pi pi-cog"/>*/}
                    {/*</a>*/}
                    {/*<a>*/}
                    {/*<span className="layout-topbar-item-text">User</span>*/}
                    {/*<span className="layout-topbar-icon pi pi-user"/>*/}
                    {/*</a>*/}
                </div>
            </div>
        );
    }
}