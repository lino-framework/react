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
        field: PropTypes.string,
        triggerKey: PropTypes.string,
        field: PropTypes.string,
        onStart: PropTypes.func,
        optionSelected: PropTypes.func
    };

    constructor(props) {
        super();
        this.startState = {
            suggestions: [],
            selectedIndex: 0,
            startPoint: 1, // Can't trigger on 0, as first char will always be triggering char
            triggered: false,
            text: "",
        };
        this.state = {...this.startState};

        this.getSuggestions = debounce(this.getSuggestions.bind(this), 25);
        this.onStart = this.onStart.bind(this);
        this.onType = this.onType.bind(this);
    }

    resetState() {
        this.setState(this.startState);
        this.inputTrigger.resetState();
    }

    getSuggestions(text) {
        // this.props.getSuggestions();
        let ajax_query = {
            query: text,
            start: 0
        };
        fetchPolyfill(`/choices/${this.props.actorId.replace(".", "/")}?${queryString.stringify(ajax_query)}`).then(
            window.App.handleAjaxResponse
        ).then(
            (data) => {
                this.setState((prevState) => {
                    return {
                        suggestions: data.rows,
                        selectedIndex: 0,

                    };
                });
            }
        ).catch(error => window.App.handleAjaxException(error));
    }

    onStart(obj) {
        this.props.onStart && this.props.onStart();
        this.setState({...obj, triggered: true});
        if (!this.state.suggestions.length) {
            this.getSuggestions();
        }
    }

    onType(obj, e) {
        this.setState(old => {
            return {...obj,}
        });
        let {text} = obj;
        this.getSuggestions(text);
    }


    selectOption(index, removeNewLine) {
        let selected = this.state.suggestions[this.state.selectedIndex];
        if (selected.text && selected.text[0] === this.props.triggerKey) {
            selected.text = selected.text.replace(this.props.triggerKey, "") // only replaces first
        }
        this.props.optionSelected(
            {...this.state, selected: selected},
            true // tells textFieldElement to remove newline.
        );
        this.resetState();

    }

    render() {
        let {props} = this;
        return <div onKeyDown={(e) => {
            console.log("onKeyPressCapture");
            if (!this.state.triggered) return;
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
                e.preventDefault(); // Doesn't work!!
                e.stopPropagation(); // Doesn't work with quill!
                this.selectOption(this.state.selectedIndex, /*true*/);
            }
            else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();

                this.resetState();
            }
        }
        }>
            <InputTrigger getElement={this.props.getElement} trigger={{
                key: this.props.triggerKey
            }}
                          onStart={this.onStart}
                          onCancel={(obj) => {
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
                {this.props.attachTo() && ReactDom.createPortal(
                    <div
                        style={{
                            position: "absolute",
                            width: "200px",
                            borderRadius: "6px",
                            background: "white",
                            boxShadow: "rgba(0, 0, 0, 0.4) 0px 1px 4px",

                            display: this.state.triggered ? "block" : "none",
                            top: this.state.cursor && this.state.cursor.top,
                            left: this.state.cursor && this.state.cursor.left,
                            minHeight: "50px",
                        }}>
                        {this.state.suggestions.map((s, i) => {
                            return <div style={{
                                minHeight: "3ch"
                            }} key={s.value}
                                        className={classNames({"l-s-selected": i === this.state.selectedIndex})}>{s.text}</div>
                        })}
                    </div>, this.props.attachTo())}
                {props.children}
            </InputTrigger></div>
    }
}

export default Suggester;