import React, {Component} from "react";
import PropTypes from "prop-types";
import key from "weak-key";

import {Button} from 'primereact/button';
import {SplitButton} from 'primereact/splitbutton';

import "./LinoBbar.css"

/**
 * Uses actor_data to render the toolbar action of a detail or grid, also checks
 */

class LinoBbar extends Component {

    static propTypes = {
        actorData: PropTypes.object,
        an: PropTypes.string,
        sr: PropTypes.array,
        rp: PropTypes.any,
        reload: PropTypes.func,
        srMap: PropTypes.func,
        runWrapper: PropTypes.func,
        disabledFields: PropTypes.object
    };
    static defaultProps = {
        srMap: sr => sr,
        sr: [],
        runWrapper: (fn) => (fn()),
        disabledFields: {},
    };

    constructor(props) {
        super();
        this.state = {
            overflowShow: false,
            width: undefined
        };
        this.runAction = this.runAction.bind(this);
        this.render_buttons = this.render_buttons.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.componentWillUnmount = this.componentWillUnmount.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.render_overflow = this.render_overflow.bind(this);
        this.action2buttonProps = this.action2buttonProps.bind(this);
        this.render_actionbutton = this.render_actionbutton.bind(this);
        this.render_splitActionButton = this.render_splitActionButton.bind(this);
        this.render_buttons = this.render_buttons.bind(this);

    }

    componentDidMount() {
        this.handleResize();
        window.addEventListener("resize", this.handleResize);
    };

    componentWillUnmount() {
        window.removeEventListener("resize", this.handleResize);
    };

    handleResize(WindowSize, event) {
        let s = {
            width: this.main.offsetWidth,
            hidden: false,
        };
        if (this.main && this.state.width === undefined) {
            s.children = [];
            this.main.childNodes.forEach(e => {
                s.children.push([e.offsetLeft,  e.offsetWidth])
                // if (e.offsetLeft + e.offsetWidth >= this.main.offsetWidth) {
                // e.classList.add("hidden");
                // s.hidden = true
                // } else {
                //     e.classList.remove("hidden")
                // }
            })
        }
        this.setState(s);
    };

    /**
     * * @param an: string, action name of action to be run
     */

    runAction(an) {
        //https://jane.saffre-rumma.net/api/working/Sessions/11119?_dc=1546445609030&sr=11119&an=end_session

        let sr = this.props.sr.map(this.props.srMap);

        window.App.runAction({
            an: an,
            actorId: this.props.actorData.id,
            rp: this.props.rp,
            status: status,
            sr: sr
        });
    }

    render_overflow() {
        return <div>
            <Button icon={"pi pi-ellipsis-v"} onClick={this.setState({overflowShow: !this.state.overflowShow})}/>
            <div>

            </div>
        </div>
    }

    action2buttonProps(action, bbar) {
        // if in a bbar and we have an icon don't use the label, but we want the label to show in split panels
        let icon_and_label = {label: action.label};
        if (action.icon) {
            icon_and_label.icon = action.icon;
            icon_and_label.label = bbar ? undefined:icon_and_label.label;
        }
        else if (action.button_text) {
            icon_and_label.label = action.button_text;
        }
        icon_and_label.disabled = action.select_rows && this.props.sr.length === 0 || this.props.disabledFields[action.an];
        icon_and_label.tooltip = action.label;
            icon_and_label.tooltipOptions = {position: 'bottom'};

        return icon_and_label

    }

    render_actionbutton(action) {
        let icon_and_label = this.action2buttonProps(action, true);
        return <Button {...icon_and_label} key={action.an}
                       onClick={() => this.props.runWrapper(() => this.runAction(action.an))}/>
    }

    render_splitActionButton(actionArray) {
        let model = actionArray.map(action => {
            let props = this.action2buttonProps(action);
            props.command = () => this.props.runWrapper(() => this.runAction(action.an));
            return props;
        });
        return <SplitButton appendTo={window.App.topDiv} {...this.action2buttonProps(actionArray[0], true)}
                            onClick={() => this.props.runWrapper(() => this.runAction(actionArray[0].an))}
                            model={model}/>
    }

    render_buttons() {
        const {actorData} = this.props;

        return actorData.ba[this.props.an].toolbarActions && actorData.ba[this.props.an].toolbarActions.map((an, i) => {
            if (Array.isArray(an)) {
                return this.render_splitActionButton(an.map(n => window.App.state.site_data.actions[n]))
            } else {
                return this.render_actionbutton(window.App.state.site_data.actions[an])
            }

        })


    }

    render() {
        // const Comp = "Table";
        // return loaded ? this.props.render(data, Comp) : <p>{placeholder}</p>;
        return <div className={"l-bbar"} ref={el => this.main = el}
                    style={{
                        overflow: "hidden",
                        width: "100%",
                        // whiteSpace: "nowrap",
                        display: "relative",
                        opacity: this.state.width ? 1 : 0
                    }}>
            {this.props.reload && <Button icon={"pi pi-refresh"} onClick={this.props.reload}/>}
            {this.render_buttons()}
            {/*{this.render_overflow()}*/}
        </div>
    }
};

export default LinoBbar