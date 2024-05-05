import { Platform, NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native'
import { ZeroconfServices } from './types';

const RNZeroconf = NativeModules.RNZeroconf

export const ImplType = {
  NSD: 'NSD',
  DNSSD: 'DNSSD',
}

export default class Zeroconf extends NativeEventEmitter {
  private _services: ZeroconfServices;
  private _publishedServices: ZeroconfServices;
  private _dListeners: { [key: string]: EmitterSubscription };

  constructor() {
    super(RNZeroconf);
    
    this._services = {}
    this._publishedServices = {}
    this._dListeners = {}

    this.addDeviceListeners()
  }

  /**
   * Add all event listeners
   */
  addDeviceListeners() {
    if (Object.keys(this._dListeners).length) {
      return this.emit('error', new Error('RNZeroconf listeners already in place.'))
    }

    this._dListeners.start =  this.addListener('RNZeroconfStart', () =>
      this.emit('start'),
    )

    this._dListeners.stop = this.addListener('RNZeroconfStop', () =>
      this.emit('stop'),
    )

    this._dListeners.error = this.addListener('RNZeroconfError', err => {
      if (this.listenerCount('error') > 0) {
        this.emit('error', new Error(err))
      }
    })

    this._dListeners.found = this.addListener('RNZeroconfFound', service => {
      if (!service || !service.name) {
        return
      }
      const { name } = service

      this._services[name] = service
      this.emit('found', name)
      this.emit('update')
    })

    this._dListeners.remove = this.addListener('RNZeroconfRemove', service => {
      if (!service || !service.name) {
        return
      }
      const { name } = service

      delete this._services[name]

      this.emit('remove', name)
      this.emit('update')
    })

    this._dListeners.resolved = this.addListener('RNZeroconfResolved', service => {
      if (!service || !service.name) {
        return
      }

      this._services[service.name] = service
      this.emit('resolved', service)
      this.emit('update')
    })

    this._dListeners.published = this.addListener(
      'RNZeroconfServiceRegistered',
      service => {
        if (!service || !service.name) {
          return
        }

        this._publishedServices[service.name] = service
        this.emit('published', service)
      },
    )

    this._dListeners.unpublished = this.addListener(
      'RNZeroconfServiceUnregistered',
      service => {
        if (!service || !service.name) {
          return
        }

        delete this._publishedServices[service.name]
        this.emit('unpublished', service)
      },
    )
  }

  /**
   * Remove all event listeners and clean map
   */
  removeDeviceListeners() {
    Object.keys(this._dListeners).forEach(name => this._dListeners[name].remove())
    this._dListeners = {}
  }

  /**
   * Get all the services already resolved
   */
  getServices() {
    return this._services
  }

  /**
   * Scan for Zeroconf services,
   * Defaults to _http._tcp. on local domain
   */
  scan(type = 'http', protocol = 'tcp', domain = 'local.', implType = ImplType.NSD) {
    this._services = {}
    this.emit('update')
    if (Platform.OS === 'android') {
      RNZeroconf.scan(type, protocol, domain, implType)
    } else {
      RNZeroconf.scan(type, protocol, domain)
    }
  }

  /**
   * Stop current scan if any
   */
  stop(implType = ImplType.NSD) {
    if (Platform.OS === 'android') {
      RNZeroconf.stop(implType)
    } else {
      RNZeroconf.stop()
    }
  }

  /**
   * Publish a service
   */
  publishService(
    type: string,
    protocol: string,
    domain: string = 'local.',
    name: string,
    port: number,
    txt: Record<string, string> = {},
    implType = ImplType.NSD) {
    if (Object.keys(txt).length !== 0) {
      Object.entries(txt).map(([key, value]) => (txt[key] = value.toString()))
    }
    if (Platform.OS === 'android') {
      RNZeroconf.registerService(type, protocol, domain, name, port, txt, implType)
    } else {
      RNZeroconf.registerService(type, protocol, domain, name, port, txt)
    }
  }

  /**
   * Unpublish a service
   */
  unpublishService(name: string, implType = ImplType.NSD) {
    if (Platform.OS === 'android') {
      RNZeroconf.unregisterService(name, implType)
    } else {
      RNZeroconf.unregisterService(name)
    }
  }
}
