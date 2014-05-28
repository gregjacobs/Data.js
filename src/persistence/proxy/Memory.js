/*global define */
define( [
	'jquery',
	'Class',
	
	'data/persistence/proxy/Proxy'
], function( jQuery, Class, Proxy ) {
	
	/**
	 * @class data.persistence.proxy.Memory
	 * @extends data.persistence.proxy.Proxy
	 * 
	 * An "in memory" proxy, which simply provides any configured raw {@link #data} to the {@link data.Model Model} or
	 * {@link data.Collection Collection} requesting it. A Model or Collection requests data via one of its "load" method(s). 
	 * 
	 * This proxy can be used to load any raw data through a {@link #reader}, in order to execute the reader's processing code 
	 * to transform the data. It may also be used for debugging, and mocking purposes in tests.
	 * 
	 * Make sure to set the {@link #data} config either at instantiation time, or via {@link #setData}, before any
	 * requests are made to read data from this proxy.
	 * 
	 * Only the {@link #read} method is implemented out of the four CRUD methods at this time. Saving or destroying models is 
	 * currently unsupported.
	 * 
	 * ## Example
	 * 
	 *     // Loads raw JSON text into a model, through a JsonReader
	 *     require( [
	 *         'data/Model',
	 *         'data/persistence/proxy/Memory',
	 *         'data/persistence/reader/Json'
	 *     ], function( Model, MemoryProxy, JsonReader ) {
	 *     
	 *         var rawJson = '{ "a": 1, "b": 2, "c": 3 }';
	 *         var proxy = new MemoryProxy( {
	 *             data : rawJson,
	 *             reader : new JsonReader()
	 *         } );
	 *         
	 *         var MyModel = Model.extend( {
	 *             attributes : [ 'a', 'b', 'c' ],
	 *             proxy : proxy
	 *         } );
	 *         
	 *         var myModel = new MyModel();
	 *         myModel.load();  // loads data from the Model's proxy. The MemoryProxy is synchronous.
	 *         
	 *         console.log( myModel.get( 'a' ) );  // logs: 1
	 *         console.log( myModel.get( 'b' ) );  // logs: 2
	 *         
	 *     } );
	 */
	var MemoryProxy = Proxy.extend( {
		
		/**
		 * @cfg {Mixed} data
		 * 
		 * The raw data which will be fed through the proxy's {@link #reader} upon {@link #read} (which is called
		 * when a {@link data.Model Model} or {@link data.Collection} is being {@link data.Model#method-load loaded}).
		 * 
		 * For example, when using a {@link data.persistence.reader.Json JsonReader}, the raw data may be a string of
		 * JSON text.
		 * 
		 * This data may also be set using the {@link #setData} method after Proxy instantiation time, but the data
		 * must be set before any {@link #read} requests are executed against the proxy.
		 */
		
		
		/**
		 * Sets the raw {@link #data} that will be fed through the proxy's {@link #reader} upon {@link #read}. See
		 * {@link #data} for details.
		 * 
		 * @param {Mixed} data The raw data for the Memory proxy to serve.
		 */
		setData : function( data ) {
			this.data = data;
		},
		
		
		/**
		 * Creates one or more Models on the persistent storage medium.
		 * 
		 * @abstract
		 * @method create
		 * @param {data.persistence.request.Create} request The CreateRequest instance to represent
		 *   the creation on the persistent storage medium.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		create : function() {
			throw new Error( "not implemented" );
		},
		
		
		/**
		 * Reads one or more Models from the persistent storage medium.
		 * 
		 * Note that this method should support the configuration options of the {@link data.persistence.request.Read ReadRequest}
		 * object. This includes handling the following configs as appropriate for the particular Proxy subclass:
		 * 
		 * - {@link data.persistence.request.Read#modelId modelId}
		 * - {@link data.persistence.request.Read#page page}/{@link data.persistence.request.Read#pageSize pageSize}
		 * - {@link data.persistence.request.Read#start start}/{@link data.persistence.request.Read#limit limit}
		 * - {@link data.persistence.request.Read#params params} (if applicable)
		 * 
		 * @abstract
		 * @method read
		 * @param {data.persistence.request.Read} request The ReadRequest instance to represent
		 *   the reading of data from the persistent storage medium.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		read : function( request ) {
			if( this.data === undefined ) throw new Error( "No `data` set on MemoryProxy" );
			
			var resultSet = this.reader.read( this.data );
			request.resolve( resultSet );
		},
		
		
		/**
		 * Updates one or more Models on the persistent storage medium.  
		 * 
		 * @abstract
		 * @method update
		 * @param {data.persistence.request.Update} request The UpdateRequest instance to represent
		 *   the update on the persistent storage medium.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		update : function() {
			throw new Error( "not implemented" );
		},
		
		
		/**
		 * Destroys (deletes) one or more Models on the persistent storage medium.
		 * 
		 * Note: This method is not named "delete", as `delete` is a JavaScript keyword.
		 * 
		 * @abstract
		 * @method destroy
		 * @param {data.persistence.request.Destroy} request The DestroyRequest instance to represent
		 *   the destruction (deletion) on the persistent storage medium.
		 * @return {jQuery.Promise} A Promise object which is resolved when the request is complete.
		 *   `done`, `fail`, and `always` callbacks are called with the `request` object provided to 
		 *   this method as the first argument.
		 */
		destroy : function() {
			throw new Error( "not implemented" );
		}
		
	} );

	// Register the persistence proxy so that it can be created by an object literal with a `type` property
	Proxy.register( 'memory', MemoryProxy );
	
	return MemoryProxy;
	
} );