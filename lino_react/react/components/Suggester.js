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
        };
        this.startState = {...this.state};

        this.getSuggestions = debounce(this.getSuggestions.bind(this), 25);
        this.onStart = this.onStart.bind(this);
        this.onType = this.onType.bind(this);
    }


    aheadOfStartPoint(state) {
        return state.cursor.selectionStart < state.startPoint
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

        if (!this.aheadOfStartPoint(this.state) || text.find("\n")){ // Don't fetch when doing stuff before startpoint.
            return
        }

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
        console.log(obj);
        this.setState(old => {
            let state = {...obj,};
            return state
        });
    }

    componentDidUpdate(oldProps, oldState) {
        this.props.componentDidUpdate && this.props.componentDidUpdate(this.state);
        if (oldState.text !== this.state.text) {
            this.getSuggestions(this.state.text);
        }
    }

    selectOption(index, removeNewLine) {

        if (!this.state.suggestions.length) { // didn't use feature, reset self.
            this.resetState();
        }

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
                {(this.state.triggered && this.state.suggestions.length && this.state.startPoint <= this.state.cursor.selectionStart && this.props.attachTo() && ReactDom.createPortal(
                    <ui role="listbox"
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

                                       className={classNames({"l-s-selected": isSel})}>{s.text}</li>
                        })}
                    </ui>, this.props.attachTo())}
                {props.children}
            </InputTrigger></div>
    }
}

export default Suggester;