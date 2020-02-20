import React, { Component } from "react";
import PropTypes from "prop-types";
import Collapse from 'rc-collapse';
import {LinoChatter} from './LinoChatter';
import 'rc-collapse/assets/index.css';
import './Conversations.css';

export class OpenConversations extends Component {
    static propTypes = {
        opened: PropTypes.func,
        sendChat: PropTypes.func,
        sendSeenAction: PropTypes.func,
        openedconversations:PropTypes.array
    };
    render() {
         
        
        return (<Collapse accordion={false} className="conversation-panel-list">
                 { this.props.openedconversations && this.props.openedconversations.map((openedconversation) => (
                            <LinoChatter 
                                //opened={opened} // timestamp for reloading
                                sendChat={this.props.sendChat}
                                sendSeenAction={this.props.sendSeenAction}
                                openedconversation={openedconversation}/>
                        
                ))}

                </Collapse>)
        
        }

    }