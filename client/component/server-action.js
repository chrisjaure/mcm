import React from 'react';
import Loader from 'react-loader';

const maxTries = 10;
const delayInSeconds = 30;

export default class ServerAction extends React.Component {
	constructor (props) {
		super(props);
		this.state = { loaded: true };
	}
	checkStatus () {
		return new Promise((resolve, reject) => {
			let tries = 0;
			let checker = () => {
				setTimeout(() => {
					tries++;
					this.props.checkStatus().then((data) => {
						resolve(data);
					}).catch(() => {
						if (tries === maxTries) {
							reject(new Error('Server status unknown'));
						}
						else {
							checker();
						}
					});
				}, 1000 * delayInSeconds);
			};
			checker();
		});
	}
	doAction () {
		this.setState({ loaded: false });
		this.props.action().then(this.checkStatus.bind(this)).then(() => {
			this.setState({ loaded: true });
		}).catch((err) => {
			this.setState({ loaded: true });
			alert(err);
		});
	}
	render () {
		return (
			<button className="btn btn-1 btn-1a" onClick={this.doAction.bind(this)} disabled={this.state.loaded ? null : true}>
				<Loader loaded={this.state.loaded} />
				{this.props.children}
			</button>
		);
	}
}