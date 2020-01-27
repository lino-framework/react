import React, {Component} from "react";
import PropTypes from "prop-types";
import {fetch as fetchPolyfill} from 'whatwg-fetch'
import key from "weak-key";
import classNames from 'classnames';
import queryString from "query-string"

export class LinoChatter extends Component {

    static propTypes = {};
    static defaultProps = {
        open: false,
    };

    constructor() {
        super();
        this.state = {
            chatlog: []
        };
        this.reload = this.reload.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
    }

    reload() {

        // todo pageing

        this.setState({
            loading: true,
        });
        let query = {
            fmt: "json",
            rp: key(this),
            // mt: this.props.actorData.content_type, // Should be the master actor's PK, so should be a prop / url param
            an: "getChats",
            limit: 10,
            count: 10,
        };
        window.App.add_su(query);

        fetchPolyfill(`/api/chat/ChatMessages/` + `?${queryString.stringify(query)}`).then(
            window.App.handleAjaxResponse
        ).then(
            this.consume_server_responce
        ).catch(/*error => window.App.handleAjaxException(error)*/);
    }

    consume_server_responce(data) {
        this.setState({
            chats: data
        })
    }

    componentDidMount() {
        this.reload()
    }

    render() {
        return <div>
            {this.state.chats && this.state.chats.map((chat) => (
                <p key={chat.pk}>
                    <span style={{float:"right"}}>{chat.user}</span>
                    <div dangerouslySetInnerHTML={chat.body}></div>
                </p>
            ))}
            <textarea placeholder={"write to group..."}/>
        </div>
    }
};