/*global define */
/*jshint eqnull:true */
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
		 * 
		 * Some examples of this might be:
		 * - "Users"
		 * - "app.Users"
		 * 
		 * Note: Once chosen, this value should never be changed. This value will be used to look up
		 * model data in the WebStorage's key/value store, and if changed, existing data will be left
		 * orphaned.
		 */
		
		/**
		 * @hide
		 * @cfg {data.persistence.reader.Reader} reader
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
			if( !this.storageKey ) throw new Error( "`storageKey` cfg required" );
			// </debug>
			
			this.cache = {};
		},
		
		
		// --------------------------------------
		
		
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
			var models = request.getModels(),
			    returnRecords = [],
			    recordIds = this.getRecordIds(),
			    deferred = new jQuery.Deferred();
			
			for( var i = 0, len = models.length; i < len; i++ ) {
				var model = models[ i ],
				    newId = this.getNewId(),  // returns a Number ID, for populating models that accept a Number ID attribute
				    returnRecord = {};

				recordIds.push( newId );
				this.setRecord( model, newId );
				
				// To allow the Model to update itself with its new ID
				returnRecord[ model.getIdAttribute().getName() ] = newId;
				returnRecords.push( returnRecord );
			}
			this.setRecordIds( recordIds );
			
			var resultSet = new ResultSet( { records: returnRecords } );
			return deferred.resolve( resultSet ).promise();
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
			var records = [],
			    recordIds = this.getRecordIds(),
			    totalNumRecords = recordIds.length,
			    modelId = request.getModelId(),
			    deferred = new jQuery.Deferred();
			
			if( modelId !== undefined ) {
				modelId = String( modelId );  // modelIds are stored in the proxy as strings (for consistency with any string IDs), so convert any number to a string
				if( _.contains( recordIds, modelId ) ) {
					records.push( this.getRecord( modelId ) ); 
				}
			} else {
				for( var i = 0; i < totalNumRecords; i++ ) {
					records.push( this.getRecord( recordIds[ i ] ) );
				}
			}
			
			// TODO: Handle the ReadRequest having page/pageSize configs
			// TODO: Handle the ReadRequest having start/limit configs
			
			var resultSet = new ResultSet( {
				records : records,
				totalCount : totalNumRecords
			} );
			return deferred.resolve( resultSet ).promise();
		},
		
		
		/**
		 * Updates one or more Models in WebStorage.
		 * 
		 * Note that if a Model does not exist in WebStorage, but is being "updated", then it will be created 
		 * instead.
		 * 
		 * @param {data.persistence.request.Update} request The UpdateRequest instance that holds the model(s) 
		 *   to be updated.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		update : function( request ) {
			var models = request.getModels(),
			    recordIds = this.getRecordIds(),
			    deferred = new jQuery.Deferred();
			
			for( var i = 0, len = models.length; i < len; i++ ) {
				var model = models[ i ],
				    modelId = String( model.getId() );  // modelIds are stored in the proxy as strings (for consistency with any string IDs), so convert any number to a string

				if( !_.contains( recordIds, modelId ) ) {
					recordIds.push( modelId );
				}
				this.setRecord( model );
			}
			this.setRecordIds( recordIds );
			
			return deferred.resolve().promise();
		},
		
		
		/**
		 * Destroys (deletes) one or more Models from WebStorage.
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
			var models = request.getModels(),
			    recordIds = this.getRecordIds(),
			    deferred = new jQuery.Deferred();
			
			for( var i = 0, len = models.length; i < len; i++ ) {
				var model = models[ i ],
				    modelId = String( model.getId() ),  // modelIds are stored in the proxy as strings (for consistency with any string IDs), so convert any number to a string
				    recordIdx = _.indexOf( recordIds, modelId );
				
				if( recordIdx !== -1 ) {
					this.removeRecord( modelId );
					recordIds.splice( recordIdx, 1 );
				}
			}
			this.setRecordIds( recordIds );
			
			return deferred.resolve().promise();
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
		 * Stores a record to the underlying WebStorage medium.
		 * 
		 * The record is stored with the Model's {@link data.Model#version version number} that represented the 
		 * Model at the time of storage, along with its underlying data. An example of the format might be this:
		 * 
		 *     {
		 *         version : 1,
		 *         data : {
		 *             attr1 : "value1",
		 *             attr2 : "value2",
		 *             ...
		 *         }
		 *     }
		 * 
		 * @protected
		 * @param {data.Model} model The Model to save a record for.
		 * @param {Number/String} [id] The ID to save the record for. If not provided, uses the Model's 
		 *   {@link data.Model#getId id}. This parameter is for saving new models, which don't have an ID yet.
		 */
		setRecord : function( model, id ) {
			if( id === undefined ) id = model.getId();
			
			var storageMedium = this.getStorageMedium(),
			    recordKey = this.getRecordKey( id ),
			    recordIds = this.getRecordIds(),
			    modelData = model.getData( { persistedOnly: true } );
			
			// Force the ID into the model data, for when 'creating', and the Model doesn't have an ID yet
			modelData[ model.getIdAttribute().getName() ] = id;
			
			var data = {
				version : model.getVersion(),
				data : modelData
			};

			storageMedium.removeItem( recordKey );  // iPad bug requires removal before setting it
			storageMedium.setItem( recordKey, JSON.stringify( data ) );
		},
		
		
		/**
		 * Removes a record by ID.
		 * 
		 * @protected
		 * @param {Number/String} id
		 */
		removeRecord : function( id ) {
			this.getStorageMedium().removeItem( this.getRecordKey( id ) ); 
		},
		
		
		/**
		 * Retrieves a record by ID from the underlying WebStorage medium.
		 * 
		 * Each record is originally stored with the Model's {@link data.Model#version version number} that represented the 
		 * Model at the time of storage, and its underlying data. An example of the format might be this:
		 * 
		 *     {
		 *         version : 1,
		 *         data : {
		 *             attr1 : "value1",
		 *             attr2 : "value2",
		 *             ...
		 *         }
		 *     }
		 * 
		 * This is passed to the {@link #migrate} method, to allow any conversion to the latest format of the model, and then
		 * the `data` is returned.
		 * 
		 * @protected
		 * @param {Number/String} id The ID of the record to retrieve.
		 * @return {Object} An object which contains the record data for the stored record, or `null`
		 *   if there is no record for the given `id`. 
		 */
		getRecord : function( id ) {
			var storageMedium = this.getStorageMedium(),
			    json = storageMedium.getItem( this.getRecordKey( id ) );
			
			if( !json ) {
				return null;
				
			} else {
				var metadata = JSON.parse( json ),
				    data = this.migrate( metadata.version, metadata.data );
				
				return data;
			}
		},
		
		
		// ------------------------------------------
		
		// Bookkeeping Methods
		
		/**
		 * Sets the list of record (model) IDs that are currently stored for the WebStorageProxy's {@link #storageKey}.
		 * 
		 * This information tells us which models are stored, and how many. It must be updated as new records are inserted,
		 * or current records are removed, for bookkeeping purposes.
		 * 
		 * @protected
		 * @param {String[]} recordIds The array of record IDs. Any numbers in the array will be converted to strings.
		 */
		setRecordIds : function( recordIds ) {
			recordIds = _.map( recordIds, function( id ) { return String( id ); } );
			var storageMedium = this.getStorageMedium(),
			    recordIdsKey = this.getRecordIdsKey();
			
			storageMedium.removeItem( recordIdsKey );  // iPad bug requires removal before setting it
			storageMedium.setItem( recordIdsKey, JSON.stringify( recordIds ) );
		},
		
		
		/**
		 * Retrieves the list of record (model) IDs that are currently stored for the WebStorageProxy's {@link #storageKey}.
		 * 
		 * This information tells us which models are stored, and how many.
		 * 
		 * @protected
		 * @return {String[]} The array of IDs that are currently stored.
		 */
		getRecordIds : function() {
			var recordIds = this.getStorageMedium().getItem( this.getRecordIdsKey() );
			
			return ( recordIds ) ? JSON.parse( recordIds ) : [];
		},
		
		
		/**
		 * Retrieves a new, sequential ID which can be used to {@link #create} records (models). Once this
		 * ID is returned, it is considered "taken", and subsequent calls to this method will return new IDs.
		 * 
		 * This method also double checks that no manually-assigned IDs would be overwritten by a generated ID.
		 * 
		 * @protected
		 * @return {Number} A new, unused sequential ID. This returns a Number ID, for populating models that 
		 *   accept a Number ID attribute. Models with a String ID property will automatically convert the
		 *   number to a String.
		 */
		getNewId : function() {
			var storageMedium = this.getStorageMedium(),
			    recordCounterKey = this.getRecordCounterKey(),
			    recordCounter = +storageMedium.getItem( recordCounterKey ) || 0,
			    currentRecordIds = this.getRecordIds(),
			    newId = recordCounter + 1;
			
			// Make sure to find a new ID that hasn't been used yet. It is possible that IDs have manually
			// been specified on one or more models, and this method must account for any that are currently stored.
			while( _.contains( currentRecordIds, String( newId ) ) ) {
				newId++;
			}
			
			storageMedium.removeItem( recordCounterKey );  // iPad bug requires removal before setting it
			storageMedium.setItem( recordCounterKey, newId );
			
			return newId;
		},

		
		/**
		 * Retrieves the WebStorage key name for the proxy's list of currently-stored record (model) IDs. This array
		 * is used for bookkeeping, so that the proxy knows which models are stored, and how many, for the particular
		 * {@link #storageKey}. 
		 * 
		 * @protected
		 * @return {String} The key name for the "recordIds" in WebStorage, for this {link #storageKey}.
		 */
		getRecordIdsKey : function() {
			return this.storageKey + '-recordIds';
		},
		

		/**
		 * Retrieves the WebStorage key name for the proxy's "record counter" for this {@link #storageKey}. This 
		 * number is used to always generate new, sequential IDs for records when being {@link #create created}.
		 * 
		 * @protected
		 * @return {String} The key name for the "record counter" in WebStorage, for this {link #storageKey}.
		 */
		getRecordCounterKey : function() {
			return this.storageKey + '-recordCounter';
		},
		
		
		/**
		 * Retrieves the WebStorage key name for the given Record, by its ID.
		 * 
		 * @protected
		 * @param {Number/String} id
		 * @return {String} The key name that will uniquely identify the record in WebStorage, for this {link #storageKey}.
		 */
		getRecordKey : function( id ) {
			// <debug>
			if( id == null ) throw new Error( "`id` arg required" );
			// </debug>
			
			return this.storageKey + '-' + id;
		},
		
		
		/**
		 * Clears all WebStorage used by the {@link #storageKey} for the WebStorageProxy.
		 * 
		 * All records are removed, as well as the associated bookkeeping data.
		 */
		clear : function() {
			var storageMedium = this.getStorageMedium(),
			    recordIds = this.getRecordIds();
			
			for( var i = 0, len = recordIds.length; i < len; i++ ) {
				this.removeRecord( recordIds[ i ] );
			}
			
			storageMedium.removeItem( this.getRecordIdsKey() );
			storageMedium.removeItem( this.getRecordCounterKey() );
		},
		
		
		// ---------------------------------------------
		
		/**
		 * Hook method to allow for a subclass to transform the data from a previous version to the latest format
		 * of the data. This method should be overridden by a subclass to implement the appropriate transformations
		 * to the `data`.
		 * 
		 * 
		 * ## Implementing a migration
		 * 
		 * By default, this method simply returns the `data` provided to it. However, here is an example of what an
		 * override might look like:
		 * 
		 *     migrate : function( version, data ) {
		 *         switch( version ) {
		 *             case 1 : 
		 *                 data.newProp = data.oldProp;
		 *                 delete data.oldProp;
		 *                 &#47;* falls through *&#47;  // note the comment to remove JSHint warning about no 'break' statement here
		 *             case 2 :
		 *                 data.newProp2 = data.oldProp2;
		 *                 delete data.oldProp2;
		 *         }
		 *         return data;
		 *     }
		 *     
		 * Note that there are no `break` statements in this `switch` block. This is because if a model's data is at version
		 * 1, then we want to apply the migrations to transform it from version 1 to version 2, and then from version 2 to version 
		 * 3 (assuming version 3 is the latest). Alternatively, you could apply all transformations in each `case`, but then 
		 * each time the Model's structure is changed, you would need to update all cases.
		 * 
		 * Tip: use the `&#47;* falls through *&#47;` annotation when using JSHint, to remove warnings about a case without 
		 * a `break` statement.
		 * 
		 * @protected
		 * @template
		 * @param {Number} version The version number of the data. This can be used in a `switch` statement to apply
		 *   data transformations to bring the data up to the latest version.
		 * @param {Object} data The data to migrate.
		 * @return {Object} The migrated data.
		 */
		migrate : function( version, data ) {
			return data;
		}
		
	} );
	
	return WebStorageProxy;
	
} );