import React, {Component} from 'react';
import classNames from 'classnames';
import PropTypes from "prop-types";

import {OverlayPanel} from 'primereact/overlaypanel';
import {Card} from 'primereact/card';
import {Button} from "primereact/button";

export class AppInlineProfile extends Component {

    static propTypes = {
        logged_in: PropTypes.bool,
        username: PropTypes.string.isRequired,
        onSignOutIn: PropTypes.func.isRequired,
        authorities: PropTypes.array,
        onAuthoritiesSelect: PropTypes.func,
        onActAsSelf: PropTypes.func,
        authAppendTo: PropTypes.instanceOf(Element),
        su_name: PropTypes.string,
        su_id: PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.instanceOf(undefined)]),
        act_as_button_text: PropTypes.string,
        act_as_title_text: PropTypes.string,
        act_as_subtext: PropTypes.string,
        act_as_self_text: PropTypes.string,
        my_setting_text: PropTypes.string,
        onMysettings: PropTypes.func.isRequired,
        // todo include currnt SU as to display correct name and act as self button
    };

    static defaultProps = {
        authorities: [],
    }

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

    renderActAsOverLay() {
        let {act_as_title_text, act_as_subtext} = this.props;
        return <OverlayPanel ref={(el) => this.op = el} appendTo={this.props.authAppendTo} className={"l-actas"}>
            <Card title={act_as_title_text} subTitle={act_as_subtext}>
                {this.props.authorities.map(auth =>
                    <React.Fragment key={auth[0]}>
                        <Button label={auth[1]} onClick={(e) => {
                            this.props.onAuthoritiesSelect(auth);
                            this.op.hide()
                        }}/>
                        <br/>
                    </React.Fragment>
                )}
            </Card>

        </OverlayPanel>

    }

    render() {
        let {username, su_name, su_id} = this.props;
        let {act_as_button_text, act_as_self_text, my_setting_text} = this.props;

        username = su_name ? `${username} acting as ${su_name}` : username;

        return <div className="profile">
            <a className="profile-link" onClick={this.onClick}>
                <span className="username">{username}</span>
                <i className="pi pi-fw pi-cog"/>
            </a>
            <ul className={classNames({'profile-expanded': this.state.expanded})}>
                <li onClick={this.props.onSignOutIn}><a><i className="pi pi-fw pi-power-off"/>
                    {this.props.logged_in ?
                        <span>Logout</span>
                        :
                        <span>Log In</span>}</a></li>
                {su_id && <li onClick={this.props.onActAsSelf}>
                    <a>
                        <i className="pi pi-fw pi-user"/>
                        <span>{act_as_self_text}</span>
                    </a>
                </li>}
                {this.props.authorities.length && <li onClick={(e) => {
                    e.target = this.actAsEl;
                    this.op.toggle(e)
                }} ref={(el) => this.actAsEl = el}>
                    <a
                    ><i className="pi pi-fw pi-users"/>
                        <span>{act_as_button_text}</span>
                    </a>

                </li>}
                {/* #3070: Add menu to open the settings page of the current user  */ }
                {this.props.logged_in && <li onClick={this.props.onMysettings}>
                        <a>
                            <i className="pi pi-fw pi-sliders-v"/>
                            <span>{my_setting_text}</span>
                        </a>
                    </li>
                }

            </ul>
            {this.renderActAsOverLay()}
        </div>;
    }
}