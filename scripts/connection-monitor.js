/*
 * Connection Monitor
 * https://github.com/cs96and/FoundryVTT-connection-monitor
 *
 * Copyright (c) 2022 Alan Davies - All Rights Reserved.
 *
 * You may use, distribute and modify this code under the terms of the MIT license.
 *
 * You should have received a copy of the MIT license with this file. If not, please visit:
 * https://mit-license.org/
 */

class ConnectionMonitor {
	constructor() {
		this._elementList = [ "logo", "controls", "navigation", "players", "hotbar" ];

		Hooks.on("ready", () => {
			game.socket.on("disconnect", () => this._onConnectionStateChange(game.socket.connected));
			game.socket.on("reconnect", () => this._onConnectionStateChange(game.socket.connected));
			game.socket.on("connect", () => this._onConnectionStateChange(game.socket.connected));
	
			Hooks.on("renderHotbar", this._onRenderApplication.bind(this));
			Hooks.on("renderSceneControls", this._onRenderApplication.bind(this));
			Hooks.on("renderPlayerList", this._onRenderApplication.bind(this));
	
/*
			// FOR TESTING UI UPDATES...
			let isConnected = true;
			setInterval(() => {
				isConnected = !isConnected;
				this._onConnectionStateChange(isConnected);
			}, 2000);
*/
		});
	}

	_onConnectionStateChange(isConnected) {
		if (isConnected)
			ui.notifications.info(game.i18n.localize("connection-monitor.reconnected"));

		for (const element of this._elementList) {
			const classList = document.getElementById(element)?.classList;
			if (classList) {
				const addOrRemoveClass = (isConnected ? classList.remove : classList.add).bind(classList);
				addOrRemoveClass("conmon-disconnected");
			}
		}
	}

	_onRenderApplication(app, html, data) {
		if (!game.socket.connected)
			html[0].classList.add("conmon-disconnected");
	}
}

const connectionMonitor = new ConnectionMonitor();
