import React from "react";
import {FileUpload} from "primereact/fileupload";
FileUpload.prototype.upload = function upload() {
    if (this.props.customUpload) {
            if (this.props.fileLimit) {
                this.uploadedFileCount += this.state.files.length;
            }

            if (this.props.uploadHandler) {
                this.props.uploadHandler({
                    files: this.state.files
                })
            }
        }
        else {
            this.setState({msgs:[]});
            let xhr = new XMLHttpRequest();
            let formData = new FormData();

            if (this.props.onBeforeUpload) {
                this.props.onBeforeUpload({
                    'xhr': xhr,
                    'formData': formData
                });
            }

            for (let file of this.state.files) {
                formData.append(this.props.name, file, file.name);
            }

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    this.setState({progress: Math.round((event.loaded * 100) / event.total)});
                }

                if (this.props.onProgress) {
                    this.props.onProgress({
                        originalEvent: event,
                        progress: this.progress
                    });
                };
            });

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    this.setState({ progress: 0 });

                    if (xhr.status >= 200 && xhr.status < 300) {
                        if (this.props.fileLimit) {
                            this.uploadedFileCount += this.state.files.length;
                        }

                        if (this.props.onUpload) {
                            this.props.onUpload({xhr: xhr, files: this.state.files});
                        }
                    }
                    else {
                        if (this.props.onError) {
                            this.props.onError({xhr: xhr, files: this.state.files});
                        }
                    }

                    this.clear();
                }
            };

            xhr.open('POST', this.props.url, true);

            if (this.props.onBeforeSend) {
                let doSend = this.props.onBeforeSend({
                    'xhr': xhr,
                    'formData': formData
                });
                if (doSend === false) {
                    return
                }
            }
            xhr.withCredentials = this.props.withCredentials;
            xhr.send(formData);
        }
}

export default FileUpload;
