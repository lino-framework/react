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
        onChatButton: PropTypes.func,
        useChat: PropTypes.bool,
        WS: PropTypes.bool,
        UnseenCount: PropTypes.number,
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
                    {this.props.useChat &&
                    <a
                        onClick={this.props.onChatButton}
                        ref={(e) => window.App.chatButton = e} // used as event target to show chat window via WS
                    >
                        {/*<span className="layout-topbar-item-text">Events</span>*/}
                        <span className="layout-topbar-icon pi pi-comments"/>
                        {!this.props.WS && <span className="layout-topbar-badge">!</span>}
                        {this.props.UnseenCount &&
                        <span className="layout-topbar-badge">{this.props.UnseenCount}</span>}

                    </a>}
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