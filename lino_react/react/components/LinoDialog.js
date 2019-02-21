import React, {Component} from "react";
import PropTypes from "prop-types";

// import {SiteContext} from "./SiteContext"
// import {Labeled} from "./LinoComponents"
//
// import {Button} from 'primereact/button';
// import {AutoComplete} from 'primereact/autocomplete';
// import queryString from "query-string";
// import {fetch as fetchPolyfill} from "whatwg-fetch";
import {Dialog} from 'primereact/dialog';
import {SiteContext} from "./SiteContext";
import LinoComponents from "./LinoComponents";
import LinoBbar from "./LinoBbar";


export class LinoDialog extends Component {

    static propTypes = {
        action: PropTypes.object, // action object from siteData
        onClose: PropTypes.func,   // Some sort of callback
        onOk: PropTypes.func,   // callback for submitting forms. Only for action panel form, not insert.
        // baseData: PropTypes.object,
        footer: PropTypes.element,
        actorId: PropTypes.string, // Full id, with . ie: tickets.Alltickets
        title: PropTypes.string,
        router: PropTypes.object, // router
        data: PropTypes.object,
        update_value: PropTypes.func,
        closable: PropTypes.bool,
        content: PropTypes.any,
    };
    static defaultProps = {
        data: {},
        closable: true,
    };

    constructor(props) {
        super();
        this.state = {
            visible: true,
            // data: Object.assign({}, props.data)
        };

        this.onClose = this.onClose.bind(this);
    };

    onClose() {
        this.setState({visible: false});
        this.props.onClose(this);

    };

    render() {

        return <SiteContext.Consumer>{(siteData) => {
            const footer = this.props.footer || <div><LinoBbar rp={this} actorData={siteData.actors[this.props.actorId]}
                                                               an={this.props.action.an} sr={[undefined]}/></div>
            // webpack wants theres decerations here, not in the if, otherwise unassigned var error in return
            let MainComp,
                layout,
                prop_bundle;

            if (!this.props.content) {
                // To allow same system to be used for yes/no dialogs
                layout = this.props.action.window_layout;
                MainComp = LinoComponents._GetComponent(layout.main.react_name);


                prop_bundle = {
                    data: this.props.data,
                    actorId: this.props.actorId,
                    action: this.props.action,
                    action_dialog: layout.main.react_name === "ActionParamsPanel",
                    // disabled_fields: this.state.disabled_fields,
                    update_value: (v) => this.props.update_value(v, this._reactInternalFiber.key),
                    editing_mode: true,
                    match: this.props.router,
                    onSubmit:this.props.onOk,
                };
                prop_bundle.prop_bundle = prop_bundle;
            }

            return <Dialog onHide={this.onClose} visible={this.state.visible}
                           header={this.props.title || this.props.action.label}
                           footer={footer}
                           closable={this.props.closable}>
                {this.props.content || <MainComp {...prop_bundle} elem={layout.main} main={true}/>}
            </Dialog>
        }}</SiteContext.Consumer>

    };
}
