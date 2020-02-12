import React, {Component} from "react";
import ReactDom from "react-dom";
import PropTypes from "prop-types";


import queryString from 'query-string';
import classNames from 'classnames';
import key from "weak-key";

import {fetch as fetchPolyfill} from 'whatwg-fetch' // fills fetch

import {debounce} from "./LinoUtils";

// import {TabPanel, TabView} from 'primereact/tabview';
// import {Panel} from 'primereact/panel';
// import {InputText} from 'primereact/inputtext';
// import {Checkbox} from 'primereact/checkbox';
// import {Editor} from 'primereact/editor';
// import {Button} from 'primereact/button';
// import {Dropdown} from 'primereact/dropdown';
// import {Password} from 'primereact/password';
// import {Calendar} from 'primereact/calendar';
// import DomHandler from "primereact/domhandler";
//
// import {LinoGrid} from "./LinoGrid";
// import {debounce} from "./LinoUtils";
// import {SiteContext} from "./SiteContext"
//

// import {ForeignKeyElement} from "./ForeignKeyElement";

import InputTrigger from 'react-input-trigger';


class Suggester extends React.Component {
    static propTypes = {
        actorData: PropTypes.object,
        actorId: PropTypes.string, // foo.bar
        id: PropTypes.string,
        triggerKeys: PropTypes.array,
        field: PropTypes.string,
        onStart: PropTypes.func,
        onCancel: PropTypes.func,
        optionSelected: PropTypes.func
    };

    constructor(props) {
        super();
        this.state = {
            suggestions: [],
            selectedIndex: 0,
            startPoint: 1, // Can't trigger on 0, as first char will always be triggering char
            triggered: false,
            text: "",
            triggeredKey: null,
        };
        this.startState = {...this.state};

        this.getSuggestions = debounce(this.getSuggestions.bind(this), 100);
        this.showSuggestions = this.showSuggestions.bind(this);
        this.onStart = this.onStart.bind(this);
        this.onType = this.onType.bind(this);
        this.renderSuggestion = this.renderSuggestion.bind(this);
        this.stopDialogClose = this.stopDialogClose.bind(this);
    }

    stopDialogClose(e) {
        console.log("sug keyDown");
        if (this.state.triggered && (e.key === "Escape" || event.which === 27)) {
            console.log("escBubble sug stop");
            e.preventDefault();
            e.stopPropagation();
            this.resetState();

        }
    }

    aheadOfStartPoint(state) {
        return state.startPoint <= state.cursor.selectionStart
    }


    resetState() {
        this.setState(this.startState);
        this.inputTrigger.resetState();
        this.div.removeEventListener('keydown', this.stopDialogClose)

    }   

    getSuggestions(text, triggeredKey) {
        // this.props.getSuggestions();
        let ajax_query = {
            query: text,
            trigger: triggeredKey || this.state.triggeredKey, // counter race conditions.
            start: 0,
            limit: 8,
        };


        let id = this.props.id === undefined ? "-99999" : this.props.id;
        if (!this.aheadOfStartPoint(this.state) || text.includes("\n")) { // Don't fetch when doing stuff before startpoint.
            // console.log("don't get sugs");
            return
        }
        let actorID = this.props.actorId.replace(".", "/")
        // let actorID = "tickets/Tickets";
        fetchPolyfill(`/api/${actorID}/${id}/${this.props.field}/suggestions?${queryString.stringify(ajax_query)}`).then(
            window.App.handleAjaxResponse
        ).then(
            (data) => {
                this.setState((prevState) => {
                    return {
                        suggestions: data.suggestions,
                        selectedIndex: 0,

                    };
                });
            }
        ).catch(error => window.App.handleAjaxException(error));
    }

    showSuggestions() {
        return this.state.triggered && this.state.suggestions && this.state.suggestions.length && this.state.startPoint <= this.state.cursor.selectionStart && this.props.attachTo()
    }

    onStart(obj) {
        this.props.onStart && this.props.onStart();
        this.setState({...obj, triggered: true});
        this.getSuggestions("", obj.triggeredKey);
        this.div.addEventListener('keydown', this.stopDialogClose)

    }

    onType(obj, e) {
        // console.log(obj);
        this.setState(old => {
            let state = {...obj,};
            return state
        });
    }

    componentDidUpdate(oldProps, oldState) {
        this.props.componentDidUpdate && this.props.componentDidUpdate(this.state);

        if (this.state.triggeredKey === null || !this.state.triggered) {
            return
        }

        if (oldState.text !== this.state.text || oldState.triggeredKey !== this.state.triggeredKey
        ) {

            if (this.state.suggestions.length === 0 && this.state.text.length >= oldState.text.length) {
                // don't keep requesting suggestions after typing.
                return
            }

            this.getSuggestions(this.state.text);
        }
    }

    selectOption(index) {
        index = index === undefined ? this.state.selectedIndex : index;
        if (!this.state.suggestions.length) { // didn't use feature, reset self.
            this.resetState();
            return
        }

        let selected = this.state.suggestions[index];
        // if (selected.text && selected.text[0] === this.props.triggerKey) {
        //     selected.text = selected.text.replace(this.props.triggerKey, "") // only replaces first
        // }
        if (this.aheadOfStartPoint(this.state)) {
            this.props.optionSelected(
                {state: this.state, selected: selected, props: this.props});
        }
        this.resetState();

    }

    renderSuggestion() {
        let {props} = this;

        if (this.showSuggestions()) return ReactDom.createPortal(
            <ui role="listbox"
                className="l-suggester-suggestions" // todo move to style sheet + add hover.

                style={{
                    position: "absolute",
                    width: "200px",
                    borderRadius: "6px",
                    background: "white",
                    boxShadow: "rgba(0, 0, 0, 0.4) 0px 1px 4px",
                    listStyle: "none",
                    marginTop: "20px",
                    display: this.state.triggered ? "block" : "none",
                    top: this.state.cursor && this.state.cursor.top,
                    left: this.state.cursor && this.state.cursor.left,
                    // minHeight: "50px",
                    zIndex: "800"
                }}>
                {this.state.suggestions.map((s, i) => {
                    let isSel = i === this.state.selectedIndex;
                    let style = {
                        minHeight: "3ch",
                        padding: "4px 8px",
                    };
                    if (isSel) {
                        style.backgroundColor = "#007ad9";
                        style.color = "#fff";
                    }

                    return <li style={style} key={s.value}
                               onClick={() => this.selectOption(i)}
                               className={classNames({"l-s-selected": isSel})}>{s[1]}</li>
                })}
            </ui>, this.props.attachTo())
    }

    render() {
        let {props} = this;

        let sugestions = this.renderSuggestion();

        return <div ref={(el) => {
            this.div = el
        }}
                    onKeyDownCapture={(e) => {
                        // console.log("onKeyPressCapture");
                        if (!this.state.triggered) {
                            return;
                        }

                        if (this.state.suggestions.length === 0 && props.triggerKeys.find((triggerKey) => e.key === triggerKey)) {
                            this.resetState(); // reset and let the input-trigger fire again with the new trigger
                            return
                        }


                        if (e.key === "ArrowDown") {
                            e.preventDefault();
                            e.stopPropagation();
                            this.setState((old) => {
                                return {selectedIndex: Math.min(old.selectedIndex + 1, old.suggestions.length - 1)}
                            });
                        }
                        else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            e.stopPropagation();
                            this.setState((old) => {
                                    return {selectedIndex: Math.max(old.selectedIndex - 1, 0)}
                                }
                            );
                        }
                        else if (e.key === "Enter") {
                            // console.log("onKeyPressCapture ENTER");

                            e.preventDefault(); // Doesn't work!!
                            e.stopPropagation(); // Doesn't work with quill!
                            this.selectOption(this.state.selectedIndex, /*true*/);
                        }
                        else if (e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("escCapture sug stop");
                            this.resetState();
                        }
                    }}
        >
            <InputTrigger getElement={this.props.getElement} trigger={{
                keys: this.props.triggerKeys
            }}
                          onStart={this.onStart}
                          onCancel={(obj) => {
                              this.resetState();
                              this.setState({...obj, triggered: false});
                              this.props.onCancel && this.props.onCancel();
                          }
                          }
                          onType={this.onType
                          }
                          ref={(e) => {
                              this.inputTrigger = e
                          }}
            >
                {sugestions}
                {props.children}
            </InputTrigger></div>
    }
}

export default Suggester;