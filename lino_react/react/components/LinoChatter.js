import React, { Component } from "react";
import PropTypes from "prop-types";
import { fetch as fetchPolyfill } from 'whatwg-fetch'
import key from "weak-key";
import classNames from 'classnames';
import queryString from "query-string"

export class LinoChatter extends Component {

    input = React.createRef();

    static propTypes = {
        sendChat: PropTypes.func,
        sendSeenAction: PropTypes.func,
    };
    static defaultProps = {
        open: false,
    };

    constructor() {
        super();
        this.state = {
            chatlog: [],
            new_message: '',
            chats: [],
            NotSeenChats: [],
        };
        this.reload = this.reload.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.keyPress = this.keyPress.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        //this.consume_server_responce = this.consume_server_responce.bind(this);
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

        fetchPolyfill(`/api/chat/ChatMessages/-99998` + `?${queryString.stringify(query)}`).then(
            window.App.handleAjaxResponse
        ).then((data) => {
                //this.consume_server_responce
                let chats_data = data.rows
                // console.log('chats_data',chats_data)
                this.setState({
                    chats: chats_data,
                    NotSeenChats:chats_data.filter(msg => msg[3] !== undefined).map(msg => msg[4])
                })
                //this.input.current.focus();
            }
        ).catch(/*error => window.App.handleAjaxException(error)*/);
    }

    consume_server_responce(data) {
        // let chats = data.rows
        // console.log('chats',chats);
        // this.setState({
        //     chats: chats
        // })
    }

    componentDidMount() {
        this.reload()
        this.scrollToBottom()
    }

    componentDidUpdate() {
        this.scrollToBottom()
    }

    scrollToBottom = () => {
        this.input.current.scrollIntoView({ behavior: 'smooth' })
    }

    handleChange(e) {
        this.setState({ new_message: e.target.value })
    }

    handleFocus(){
        //let chatids = this.state.chats.map(msg => msg[4])
        // console.log('handleFocus',this.state.NotSeenChats)
        this.props.sendSeenAction(this.state.NotSeenChats)
        this.state.NotSeenChats = []
    }

    keyPress(e) {
        if (e.keyCode == 13) {
            // console.log('new_message', e.target.value)
            this.props.sendChat(e.target.value)
            e.target.value = ""
            this.reload()
            // put the login here
        }
    }

    render() {
        const divStyle = {
            'overflow-y': 'auto',
            'max-height': '250px',
          };
        return <div style={ divStyle } id="chatwindow">
            {this.state.chats && this.state.chats.map((chat) => (
                <p key={chat[0]}>
                    <span style={{ float: "right" }}>{chat[0]}</span>
                    <div>{chat[1]}</div>
                </p>
            ))}
            <input placeholder={"write to group..."} 
                    value={this.state.value} 
                    onKeyDown={this.keyPress} 
                    onChange={this.handleChange}
                    onFocus={this.handleFocus}
                    type="text" 
                    autoComplete="off"
                    autofocus
                    ref={this.input}
                    />
        </div>
    }
};