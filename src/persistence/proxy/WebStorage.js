/*global define */
define( [
	'jquery',
	'lodash',
	'Class',
	'data/persistence/proxy/Proxy',
	'data/persistence/ResultSet'
], function( jQuery, _, Class, Proxy, ResultSet ) {
	
	/**
	 * @abstract
	 * @class data.persistence.proxy.WebStorage
	 * @extends data.persistence.proxy.Proxy
	 * 
	 * The WebStorage proxy is the abstract base class for using the HTML5 local storage mechanisms. These include
	 * the {@link data.persistence.proxy.LocalStorage LocalStorage proxy} and the 
	 * {@link data.persistence.proxy.SessionStorage SessionStorage proxy}. 
	 * 
	 * WebStorage proxy is responsible for performing CRUD requests through to the `localStorage` or `sessionStorage` APIs,
	 * and serializing model data to and from the backing data store. See subclasses for details on usage.
	 * 
	 * Note: The HTML5 local storage APIs are available for the following browsers:
	 * 
	 * - IE8+ (with the HTML5 doctype: `<!DOCTYPE html>`)
	 * - Chrome 4+
	 * - Firefox 3.5+
	 * - Safari 4+
	 * - Opera 10.5+
	 * - iOS Safari 3.2+
	 * - Android Browser 2.1+
	 * - Blackberry Browser 7+
	 * - Opera Mobile 11+
	 * - Chrome for Android 28+
	 * - Firefox for Android 23+
	 * 
	 * Keep your target audience in mind when using one of the WebStorage proxies. 
	 */
	var WebStorageProxy = Proxy.extend( {
		abstractClass : true,
		
		/**
		 * @cfg {String} storageKey (required)
		 * 
		 * The storage key which will be used to read and save data. 
		 * 
		 * This must be unique for a given model/collection, as the LocalStorage/SessionStorage 
		 * objects are a simple key/value store. If two or more WebStorage proxies have the same 
		 * storageKey, they may conflict. 
		 */
		
		/**
		 * @hide
		 * @cfg {data.persistence.reader.Reader} reader
		 * 
		 * The WebStorage proxy uses its own scheme to store model data using local storage. 
		 */
		
		/**
		 * @hide
		 * @cfg {data.persistence.writer.Writer} writer
		 * 
		 * The WebStorage proxy uses its own scheme to store model data using local storage. 
		 */
		
		
		/**
		 * @protected
		 * @property {Object} cache
		 * 
		 * A local cache of the record data that has been read or stored. This Object (a map)
		 * is keyed by the record's ID, where the values are Objects with the data. 
		 */
		
		
		/**
		 * @constructor
		 * @param {Object} cfg The configuration options for this class, specified in an Object (map).
		 */
		constructor : function( cfg ) {
			this._super( arguments );
			
			// <debug>
			if( !this.storageKey ) throw new Error( "`storageKey` cfg required for WebStorage proxy" );
			// </debug>
			
			this.cache = {};
		},
		
		
		
		/**
		 * Creates one or more Models in WebStorage.
		 * 
		 * @param {data.persistence.request.Create} request The CreateRequest instance that holds the model(s) 
		 *   to be created.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		create : function( request ) {
			var proxyData = this.getData(),
				data = proxyData.data,
		},
		
		
		/**
		 * Reads one or more {@link data.Model Models} from WebStorage.
		 * 
		 * @param {data.persistence.request.Read} request The ReadRequest instance that describes the 
		 *   model(s) to be read.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		read : function( request ) {
			var proxyData = this.getData(),
				data = proxyData.data,
				resultSet = ( data ) ? this.reader.read( data ) : new ResultSet(),  // empty resultset if no data
				deferred = new jQuery.Deferred();
			
			// TODO: Handle the ReadRequest having a modelId config
			// TODO: Handle the ReadRequest having page/pageSize configs
			// TODO: Handle the ReadRequest having start/limit configs
			
			request.setResultSet( resultSet );
			request.setSuccess();
			deferred.resolve( request );
			
			return deferred.promise();
		},
		
		
		/**
		 * Updates the given Model on the server.  This method uses "incremental" updates, in which only the changed attributes of the `model`
		 * are persisted.
		 * 
		 * @param {data.persistence.request.Update} request The UpdateRequest instance that holds the model(s) 
		 *   to be updated.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		update : function( request ) {
			throw new Error( "update() not yet implemented" );
		},
		
		
		/**
		 * Destroys (deletes) the Model on the server.
		 * 
		 * Note that this method is not named "delete" as "delete" is a JavaScript reserved word.
		 * 
		 * @param {data.persistence.request.Destroy} request The DestroyRequest instance that holds the model(s) 
		 *   to be destroyed.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		destroy : function( request ) {
			throw new Error( "destroy() not yet implemented" );
		},
		
		
		/**
		 * Retrieves the WebStorage medium to use. This will either be the `window.localStorage` or 
		 * `window.sessionStorage` object.
		 * 
		 * @protected
		 * @abstract
		 * @return {Object} Either the `window.localStorage` or `window.sessionStorage` object, or 
		 *   `undefined` if the particular implementation is unavailable.
		 */
		getStorageMedium : Class.abstractMethod,
		
		
		// --------------------------------------
		
		
		/**
		 * Retrieves a record by ID from the underlying WebStorage medium.
		 * 
		 * Each record is originally stored with the {@link data.Model#version version number} that represented the Model 
		 * at the time of storage.
		 * 
		 * @protected
		 * @param {Number} id The ID of the record to retrieve.
		 * @return {Object} An object which contains the metadata and data for the stored record, or `null`
		 *   if there is no record for the given `id`. When the object is returned (for a found record), the
		 *   Object has the following properties:
		 * @return {Number} return.version The version number of the record when it was stored.
		 * @return {Object} return.data The stored data for the record, as an anonymous object.
		 */
		getRecord : function( id ) {
			var storageMedium = this.getStorageMedium(),
			    json = storageMedium[ this.storageKey ];
			
			if( !json ) {
				return null;
				
			} else {
				var metadata = JSON.parse( json );
				
				
				return metadata;
			}
		},
		
		
		/**
		 * Retrieves the data and metadata from the underlying WebStorage medium.
		 * 
		 * @protected
		 * @return {Object} An object which contains the data and metadata for the stored data. This
		 *   Object has the following properties:
		 * @return {String} return.data The stored, serialized data. Will be an empty string if there
		 *   is no stored data.
		 */
		getStoredData : function() {
			var storageMedium = this.getStorageMedium(),
			    rawJson = storageMedium[ this.storageKey ],
			    metadata = ( rawJson ) ? JSON.parse( rawJson ) : {};
			
			// No data stored yet, set to empty string
			metadata.data = metadata.data || "";
			
			return metadata;
		}
		
	} );
	
	return WebStorageProxy;
	
} );