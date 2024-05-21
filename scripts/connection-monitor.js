/*
 * Connection Monitor
 * https://github.com/cs96and/FoundryVTT-connection-monitor
 *
 * Copyright (c) 2022-2024 Alan Davies - All Rights Reserved.
 *
 * You may use, distribute and modify this code under the terms of the MIT license.
 *
 * You should have received a copy of the MIT license with this file. If not, please visit:
 * https://mit-license.org/
 */

class ConnectionMonitor {
	#elementList = [ "logo", "controls", "navigation", "players", "hotbar" ];
	#worldId;
	#initialUptime;

	constructor() {
		Hooks.once("ready", async () => {
			this.#worldId = game.world.id;
			this.#initialUptime = (await ConnectionMonitor.#getStatus())?.uptime;

			game.socket.on("disconnect", () => this.#onConnectionStateChange(game.socket.connected));
			game.socket.on("reconnect", () => this.#onConnectionStateChange(game.socket.connected));
			game.socket.on("connect", () => this.#onConnectionStateChange(game.socket.connected));
	
			Hooks.on("renderHotbar", this.#onRenderApplication.bind(this));
			Hooks.on("renderSceneControls", this.#onRenderApplication.bind(this));
			Hooks.on("renderPlayerList", this.#onRenderApplication.bind(this));

/*
			// FOR TESTING UI UPDATES...
			let isConnected = true;
			setInterval(() => {
				isConnected = !isConnected;
				this.#onConnectionStateChange(isConnected);
			}, 2000);
*/
		});
	}

	async #onConnectionStateChange(isConnected) {
		if (isConnected) {
			// Use the REST API to get the current game status, to make sure the world is back up and running.
			const status = await ConnectionMonitor.#getStatus();
			if (!status?.active) {
				ui.notifications.warn("connection-monitor.no-active-world", { localize: true, permanent: true });
				return;
			} else if (status.world !== this.#worldId) {
				ui.notifications.warn("connection-monitor.world-changed", { localize: true, permanent: true });
				return;
			} else if (status.uptime < this.#initialUptime) {
				ui.notifications.warn("connection-monitor.world-restarted", { localize: true, permanent: true });
				return;
			}
		}

		for (const element of this.#elementList) {
			const classList = document.getElementById(element)?.classList;
			if (classList) {
				const addOrRemoveClass = (isConnected ? classList.remove : classList.add).bind(classList);
				addOrRemoveClass("conmon-disconnected");
			}
		}
	}

	#onRenderApplication(app, html, data) {
		if (!game.socket.connected)
			html[0].classList.add("conmon-disconnected");
	}

	static async #getStatus() {
		const statusUrl = window.location.href.replace(/\/game$/, "/api/status");
		const status = await fetch(statusUrl);
		if (!status.ok)
			return undefined;
		return await status.json();
	}
}

const connectionMonitor = new ConnectionMonitor();
