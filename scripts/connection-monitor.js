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

		Hooks.once("ready", async () => {
			this._worldId = game.world.id;
			this._initialUptime = (await ConnectionMonitor._getStatus())?.uptime;

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

	async _onConnectionStateChange(isConnected) {
		if (isConnected) {
			// Use the REST API to get the current game status, to make sure the world is back up and running.
			const status = await ConnectionMonitor._getStatus();
			if (!status?.active) {
				ui.notifications.warn("connection-monitor.no-active-world", { localize: true, permanent: true });
				return;
			} else if (status.world !== this._worldId) {
				ui.notifications.warn("connection-monitor.world-changed", { localize: true, permanent: true });
				return;
			} else if (status.uptime < this._initialUptime) {
				ui.notifications.warn("connection-monitor.world-restarted", { localize: true, permanent: true });
				return;
			} else if (!ConnectionMonitor.isV10()) {
				ui.notifications.info("connection-monitor.reconnected", { localize: true });
			}
		}

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

	static async _getStatus() {
		const statusUrl = window.location.href.replace(/\/game$/, "/api/status");
		const status = await fetch(statusUrl);
		if (!status.ok)
			return undefined;
		return await status.json();
	}

    static isV10() {
		return !isNewerVersion("10", game.version ?? game.data.version);
	}
}

const connectionMonitor = new ConnectionMonitor();
