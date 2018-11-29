import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from "prop-types";


export class AppInlineProfile extends Component {

    static propTypes = {
        logged_in: PropTypes.bool,
        username: PropTypes.string.isRequired,
        onSignOutIn: PropTypes.func.isRequired
    };

    constructor() {
        super();
        this.state = {
            expanded: false
        };
        this.onClick = this.onClick.bind(this);
    }

    onClick(event) {
        this.setState({expanded: !this.state.expanded});
        event.preventDefault();
    }

    render() {
        return  (
            <div className="profile">
                <a className="profile-link" onClick={this.onClick}>
                    <span className="username">{this.props.username}</span>
                    <i className="pi pi-fw pi-cog"/>
                </a>
                <ul className={classNames({'profile-expanded': this.state.expanded})}>
                    <li onClick={this.props.onSignOutIn}><a><i className="pi pi-fw pi-power-off"/>
                        {this.props.logged_in?
                            <span>Logout</span>
                            :
                            <span>Log In</span>}</a></li>
                </ul>
            </div>
        );
    }
}