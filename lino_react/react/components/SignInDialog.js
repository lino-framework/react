import React, {Component} from "react";
import PropTypes from "prop-types";

import {Dialog} from 'primereact/dialog';

import {Button} from 'primereact/button';

import {Password} from 'primereact/password';
import {InputText} from 'primereact/inputtext';

import key from "weak-key";

export class SignInDialog extends Component {

    static propTypes = {
        visible: PropTypes.bool,
        onClose: PropTypes.func,
        onSignIn: PropTypes.func,
    };
    static defaultProps = {};

    constructor() {
        super();
        this.state = {
            password: "",
            username: ""
        };
        this.onHide = this.onHide.bind(this);
    }

    // method() {return this.props.}
    onHide(e) {
        this.props.onClose();
    }

    componentDidMount() {
    };

    render() {
        const footer = (
            <div>
                <Button label="Sign In" icon="pi pi-check" onClick={() => (this.props.onSignIn({
                    username: this.state.username,
                    password: this.state.password
                }))}/>
                <Button label="Cancel" icon="pi pi-times" onClick={this.onHide} className="p-button-secondary"/>
            </div>
        );

        return (
            <div>
                <Dialog header="Welcome To Our linosite" visible={this.props.visible} width="500px " footer={footer}
                        minY={70}
                        onHide={this.onHide} maximizable={false}>
                    {/*{Object.entries(this.).map(el => <th key={key(el)}>{el[0]}</th>)}*/}
                    <form>
                        <div className="card">
                        <div className="p-grid p-justify-center p-fluid">
                            <div className="p-col-12">
                                    <span className="p-float-label">
                                        <InputText id="signin-username" value={this.state.username}
                                                   className="p-inputtext p-component"
                                                   onChange={(e) => this.setState({username: e.target.value})}/>
                                        <label htmlFor="signin-username">Username</label>
                                    </span>
                            </div>

                            <div className="p-col-12 ">
                                    <span className="p-float-label">
                                        <Password id="signin-password" feedback={false} value={this.state.password}
                                                  className="p-inputtext p-component"
                                                  onChange={(e) => this.setState({password: e.target.value})}/>
                                        <label htmlFor="signin-password">password</label>
                                    </span>
                            </div>
                        </div>
                        </div>
                    </form>
                </Dialog>
            </div>
        )
    }
};