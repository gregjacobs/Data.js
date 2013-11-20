/*global define, beforeEach, afterEach, it, expect */
define( [
	'lodash',
	'Class',
	
	'data/Model',
	'data/Collection',
	'data/persistence/ResultSet',
	
	'spec/lib/ManualProxy',
	'spec/lib/CollectionPersistenceVerifier'
], function( _, Class, Model, Collection, ResultSet, ManualProxy, CollectionPersistenceVerifier ) {
	
	/**
	 * @class spec.unit.CollectionSpec.AbstractLoadTester
	 * 
	 * A class for testing the different "load" methods of {@link data.Collection}. This includes:
	 * 
	 * - {@link data.Collection#load}
	 * - {@link data.Collection#loadRange}
	 * - {@link data.Collection#loadPage}
	 * - {@link data.Collection#loadPageRange}
	 * 
	 * Since the generalized tests for these four methods are so similar, this class attempts to remove the 
	 * duplication between them, while still allowing for the flexibility to implement any nuances using 
	 * abstract/hook methods. It also allows for each method to have any additional method-specific tests 
	 * added. See the subclasses of this class:
	 * 
	 * - {@link spec.unit.CollectionSpec.LoadTestCreator}
	 * - {@link spec.unit.CollectionSpec.LoadRangeTestCreator}
	 * - {@link spec.unit.CollectionSpec.LoadPageTestCreator}
	 * - {@link spec.unit.CollectionSpec.LoadPageRangeTestCreator}
	 */
	var CollectionLoadTester = Class.extend( {
		abstractClass : true,
		
		/**
		 * Creates the tests for the particular "load" method being tested. 
		 * 
		 * Creates the `beforeEach`, all of the tests which will be executed, and the `afterEach` (if any).
		 * 
		 * This is the public method which should be called from the Spec file.
		 */
		createTests : function() {
			beforeEach( _.bind( this.beforeEach, this ) );
			
			this.buildTests();
			
			afterEach( _.bind( this.afterEach, this ) );
		},
		
		
		/**
		 * Implementation of the Jasmine `beforeEach` block, which creates a {@link spec.lib.ManualProxy ManualProxy},
		 * and {@link data.Model Model} and {@link data.Collection Collection} subclasses that use this proxy for
		 * the tests.
		 * 
		 * Subclasses may override and extend this implementation.
		 * 
		 * @protected
		 */
		beforeEach : function() {
			this.manualProxy = new ManualProxy();
			
			this.ManualProxyModel = Model.extend( {
				attributes : [ 'id', 'name' ],
				proxy : this.manualProxy
			} );
			
			var defaultCollectionConfig = this.getDefaultCollectionConfig();
			this.ManualProxyCollection = Collection.extend( _.assign( {}, defaultCollectionConfig, {
				model : this.ManualProxyModel,
				proxy : this.manualProxy
			} ) );
		},
		
		
		/**
		 * Implementation of the Jasmine `afterEach` block. Currently, there is an empty function, but subclasses 
		 * may override and extend this method to add their own subclass-specific implementation.
		 * 
		 * @protected
		 */
		afterEach : function() {},
		
		
		/**
		 * Protected method which does the actual building of the tests. This method should be extended in subclasses to
		 * create any additional tests for a specific "load" method.
		 * 
		 * This method should basically just call the Jasmine `it()` function, to create tests.
		 * 
		 * @protected
		 */
		buildTests: function() {
			it( "should throw an error if no proxy is configured", _.bind( this.test_errorIfNoProxy, this ) );
			it( "should throw an error if it has no proxy but has a Model, but that model has no proxy configured", _.bind( this.test_errorIfNoProxyOnModel, this ) );
			it( "should call the proxy's read() method, when the proxy is configured on the Collection", _.bind( this.test_shouldCallProxyRead, this ) );
			it( "should call the proxy's read() method, when the proxy is configured on the Collection's Model", _.bind( this.test_shouldCallModelProxyRead, this ) );
			it( "should call the proxy's read() method with any `params` option provided to the method", _.bind( this.test_shouldPassParamsToProxy, this ) );
			it( "should load the models returned by the data in the proxy", _.bind( this.test_shouldLoadModelsFromProxy, this ) );
			it( "should throw an error when there are object response properties which don't match the model's attributes, when the `ignoreUnknownAttrsOnLoad` config is false", _.bind( this.test_shouldThrowWhenUnknownAttrs_whenIgnoreIsFalse, this ) );
			it( "should *not* throw an error when there are response properties don't match the model's attributes, when the `ignoreUnknownAttrsOnLoad` config is true", _.bind( this.test_shouldNotThrowWhenUnknownAttrs_whenIgnoreIsTrue, this ) );
			it( "should add the models returned by the data in the proxy, when the 'addModels' option is set to true", _.bind( this.test_shouldAddModelsWhenOptionIsTrue, this ) );
			it( "should set the totalCount property on the Collection if the property is available on the resulting ResultSet", _.bind( this.test_shouldSetTotalCountWhenAvailable, this ) );
			it( "should *not* set the totalCount property on the Collection if the property is *not* available on the resulting ResultSet", _.bind( this.test_shouldNotSetTotalCountWhenNotAvailable, this ) );
			
			// Callbacks, Promise Handlers, and Events tests
			it( "when successful, should call its success/complete callbacks, fire the appropriate events, and resolve its deferred with the arguments: [collection, operation]", _.bind( this.test_successCallbacksHandlersAndEvents, this ) );
			it( "when an error occurs, should call its error/complete callbacks, fire the appropriate events, and reject its deferred with the arguments: [collection, operation]", _.bind( this.test_errorCallbacksHandlersAndEvents, this ) );
			it( "when the operation is aborted (canceled), should call its cancel/complete callbacks, fire the appropriate events, and cancel its deferred with the arguments: [collection, operation]. " +
				"It should also not allow the collection to be populated even if the request completes afterwards", _.bind( this.test_cancelCallbacksHandlersAndEvents_withLaterResolve, this ) );
			it( "when the operation is aborted (canceled), should call its cancel/complete callbacks, fire the appropriate events, and cancel its deferred with the arguments: [collection, operation]. " +
				"It should also not call 'error' callbacks/events if the request fails afterwards", _.bind( this.test_cancelCallbacksHandlersAndEvents_withLaterReject, this ) );
		},
		
		
		// -------------------------------------
		
		
		/**
		 * Retrieves the default config that should be applied to the Collection subclass that is created
		 * for the tests. Properties may be added to this object depending on the test, but this is, for example,
		 * to add a default {@link data.Collection#pageSize} config for {@link data.Collection#loadPage} and
		 * {@link data.Collection#loadPageRange} tests.
		 * 
		 * @protected
		 * @method getDefaultCollectionConfig
		 * @return {Object} An Object (map) of the default configuration for the Collection.
		 */
		getDefaultCollectionConfig : function() {
			return {};  // default implementation - no extra default config
		},
		
		
		/**
		 * Retrieves the name of the method under test.
		 * 
		 * @protected
		 * @abstract
		 * @method getLoadMethodName
		 * @return {String} One of: 'load', 'loadRange', 'loadPage', 'loadPageRange'.
		 */
		getLoadMethodName : Class.abstractMethod,
		
		
		/**
		 * Retrieves the set of arguments that should be passed to the load method under test.
		 * For example, loadRange() should return an array like: `[ 0, 9 ]` to satisfy
		 * its two required arguments.
		 *
		 * @protected
		 * @abstract
		 * @method getLoadMethodArgs
		 * @return {Mixed[]} The array of arguments to provide.
		 */
		getLoadMethodArgs : Class.abstractMethod,
		
		
		/**
		 * Executes the method under test. This pulls from {@link #getLoadMethodName} and {@link getLoadMethodArgs}
		 * in order to execute the method. 
		 * 
		 * Basically provides a one-liner for tests to execute the method which is being tested.
		 * 
		 * @protected
		 * @param {data.Collection} collection The Collection instance to execute the method under test on.
		 * @param {Object} [options] Any options to pass to the "load" method under test. This relates to the
		 *   `options` parameter accepted by the "load" method.
		 * @return {data.persistence.operation.Operation} The Operation object returned from the
		 *   "load" method under test ({@link data.Collection#load}, {@link data.Collection#loadRange}, 
		 *   {@link data.Collection#loadPage}, {@link data.Collection#loadPageRange})
		 */
		executeLoadMethod : function( collection, options ) {
			var loadMethodName = this.getLoadMethodName(),
			    loadMethodArgs = this.getLoadMethodArgs();
			
			return collection[ loadMethodName ].apply( collection, loadMethodArgs.concat( options ) );
		},
		
		
		// -------------------------------------
		
		// Tests
		
		test_errorIfNoProxy : function() {
			var MyCollection = Collection.extend( _.assign( {}, this.getDefaultCollectionConfig(), {
				// note: no proxy, and no model
			} ) );
			
			var me = this,
			    collection = new MyCollection();
			
			expect( function() {
				me.executeLoadMethod( collection );
			} ).toThrow( "data.Collection::doLoad() error: Cannot load. No `proxy` configured on the Collection or the Collection's `model`." );
		},
		
		
		test_errorIfNoProxyOnModel : function() {
			var MyCollection = Collection.extend( _.assign( {}, this.getDefaultCollectionConfig(), {
				// note: no proxy, and a model that doesn't have a proxy
				model : Model.extend( { /* no proxy on model */ } )
			} ) );
			var me = this,
			    collection = new MyCollection();
			
			expect( function() {
				me.executeLoadMethod( collection );
			} ).toThrow( "data.Collection::doLoad() error: Cannot load. No `proxy` configured on the Collection or the Collection's `model`." );
		},
		
		
		test_shouldCallProxyRead : function() {
			var collection = new this.ManualProxyCollection();
			
			this.executeLoadMethod( collection );
			expect( this.manualProxy.getReadRequestCount() ).toBe( 1 );
		},
		
		
		test_shouldCallModelProxyRead : function() {
			var MyCollection = Collection.extend( _.assign( {}, this.getDefaultCollectionConfig(), {
				model : this.ManualProxyModel
				// -- note: no proxy of its own - will use proxy from model
			} ) );
			
			var collection = new MyCollection();
			
			this.executeLoadMethod( collection );
			expect( this.manualProxy.getReadRequestCount() ).toBe( 1 );
		},
		
		
		test_shouldPassParamsToProxy : function() {
			var collection = new this.ManualProxyCollection(),
			    inputParams = { a: 1 };
			
			this.executeLoadMethod( collection, { params: inputParams } );
			expect( this.manualProxy.getReadRequest( 0 ).getParams() ).toBe( inputParams );
		},
		
		
		test_shouldLoadModelsFromProxy : function() {
			var collection = new this.ManualProxyCollection();
			
			// Call the 'load' method
			this.executeLoadMethod( collection );
			
			// Resolve the "read" request that the load() operation performed (the first 'read' request)
			this.manualProxy.resolveRead( 0, [
				{ id: 1, name: "John" },
				{ id: 2, name: "Jane" }
			] );
			
			expect( collection.getData() ).toEqual( [
				{ id: 1, name: "John" },
				{ id: 2, name: "Jane" }
			] );
		},

		
		test_shouldThrowWhenUnknownAttrs_whenIgnoreIsFalse : function() {
			var MyCollection = this.ManualProxyCollection.extend( {
				ignoreUnknownAttrsOnLoad: false
			} );
			
			var collection = new MyCollection(),
			    manualProxy = this.manualProxy;
			
			// Call the 'load' method
			this.executeLoadMethod( collection );
			
			expect( function() {
				
				// Resolve the "read" request that the load() operation performed (the first 'read' request)
				var returnData = [
					{ id: 1, name: "John", address: "123 Main St" }  // `address` attribute should cause an error to be thrown here
				];
				manualProxy.resolveRead( 0, returnData );
				
			} ).toThrow( "data.Model.set(): An attribute with the attributeName 'address' was not found." );
		},
		
		
		test_shouldNotThrowWhenUnknownAttrs_whenIgnoreIsTrue : function() {
			var MyCollection = this.ManualProxyCollection.extend( {
				ignoreUnknownAttrsOnLoad: true
			} );
			
			var collection = new MyCollection();
			
			// Call the 'load' method
			this.executeLoadMethod( collection );
			
			// Resolve the "read" request that the 'load' operation performed (the first 'read' request)
			this.manualProxy.resolveRead( 0, [
				{ id: 1, name: "John", address: "123 Main St" }  // `address` attribute should be ignored here
			] );
			
			expect( collection.getData() ).toEqual( [ { id: 1, name: "John" } ] );
		},
		
		
		test_shouldAddModelsWhenOptionIsTrue : function() {
			var collection = new this.ManualProxyCollection( {
				data : [ { id: 1, name: "John" }, { id: 2, name: "Jane" } ]
			} );
			
			// Call the 'load' method
			this.executeLoadMethod( collection, { addModels: true } );
			
			this.manualProxy.resolveRead( 0, [ { id: 3, name: "Fred" }, { id: 4, name: "Felicia" } ] );  // Resolve the "read" request that the load() operation performed (the first 'read' request)
			
			expect( collection.getData() ).toEqual( [
				{ id: 1, name: "John" },
				{ id: 2, name: "Jane" },
				{ id: 3, name: "Fred" },    // added by load operation
				{ id: 4, name: "Felicia" }  // added by load operation
			] );
		},
		
		
		test_shouldSetTotalCountWhenAvailable : function() {
			var collection = new this.ManualProxyCollection();
			
			expect( collection.getTotalCount() ).toBeUndefined();  // initial condition
			
			// Call the 'load' method
			this.executeLoadMethod( collection );
			
			this.manualProxy.resolveRead( 0, new ResultSet( {  // Resolve the "read" request that the 'load' operation performed (the first 'read' request)
				records : [ { id: 1, name: "John" }, { id: 2, name: "Jane" } ],
				totalCount : 100
			} ) );
			
			expect( collection.getCount() ).toBe( 2 );
			expect( collection.getTotalCount() ).toBe( 100 );
		},
			
			
		test_shouldNotSetTotalCountWhenNotAvailable : function() {
			var collection = new this.ManualProxyCollection(),
			    manualProxy = this.manualProxy;
			
			expect( collection.getTotalCount() ).toBeUndefined();  // initial condition
			
			// Call the 'load' method
			this.executeLoadMethod( collection );
			
			manualProxy.resolveRead( 0, new ResultSet( {   // Resolve the "read" request that the load() operation performed (the first 'read' request)
				records : [ { id: 1, name: "John" }, { id: 2, name: "Jane" } ]
				// totalCount : 100  -- not providing `totalCount` config for this test
			} ) );
			
			expect( collection.getCount() ).toBe( 2 );
			expect( collection.getTotalCount() ).toBeUndefined();
		},
		
		
		// -------------------------------------
		
		// Callbacks, Handlers, and Events tests
		
		test_successCallbacksHandlersAndEvents : function() {
			var collection = new this.ManualProxyCollection(),
			    manualProxy = this.manualProxy,
			    loadMethodName = this.getLoadMethodName(),
			    loadMethodArgs = this.getLoadMethodArgs(),
			    persistenceVerifier = new CollectionPersistenceVerifier( { collection: collection } );
			
			// Call the 'load' method with the persistenceVerifier
			persistenceVerifier.execute.apply( persistenceVerifier, [ loadMethodName ].concat( loadMethodArgs ) );
			
			manualProxy.resolveRead( 0, [ { id: 1 } ] );  // Resolve the "read" request that the load operation performed (the first 'read' request), and 
			persistenceVerifier.verify( 'success' );  // verify that the appropriate events/callbacks/handlers were called
		},
		
		
		test_errorCallbacksHandlersAndEvents : function() {
			var collection = new this.ManualProxyCollection(),
			    manualProxy = this.manualProxy,
			    loadMethodName = this.getLoadMethodName(),
			    loadMethodArgs = this.getLoadMethodArgs(),
			    persistenceVerifier = new CollectionPersistenceVerifier( { collection: collection } );
			
			// Call the 'load' method with the persistenceVerifier
			persistenceVerifier.execute.apply( persistenceVerifier, [ loadMethodName ].concat( loadMethodArgs ) );
			
			manualProxy.rejectRead( 0 );  // Reject the "read" request that the load operation performed (the first 'read' request), and 
			persistenceVerifier.verify( 'error' );  // verify that the appropriate events/callbacks/handlers were called
		},
		
		
		test_cancelCallbacksHandlersAndEvents_withLaterResolve : function() {
			var collection = new this.ManualProxyCollection(),
			    manualProxy = this.manualProxy,
			    loadMethodName = this.getLoadMethodName(),
			    loadMethodArgs = this.getLoadMethodArgs(),
			    persistenceVerifier = new CollectionPersistenceVerifier( { collection: collection } );
			
			// Call the 'load' method with the persistenceVerifier
			var operation = persistenceVerifier.execute.apply( persistenceVerifier, [ loadMethodName ].concat( loadMethodArgs ) );
			
			// Abort (cancel) the LoadOperation
			operation.abort();
			
			// Test that if the request completes after the LoadOperation has been aborted, that it has no effect
			manualProxy.resolveRead( 0, [ { id: 1 } ] );  // Resolve the "read" request that the load operation performed (the first 'read' request), and
			expect( collection.getCount() ).toEqual( 0 ); // The "read" model should not have been loaded into the Collection, since the operation was aborted
			
			persistenceVerifier.verify( 'cancel' );  // verify that the appropriate events/callbacks/handlers were called
		},
		
		
		test_cancelCallbacksHandlersAndEvents_withLaterReject : function() {
			var collection = new this.ManualProxyCollection(),
			    manualProxy = this.manualProxy,
			    loadMethodName = this.getLoadMethodName(),
			    loadMethodArgs = this.getLoadMethodArgs(),
			    persistenceVerifier = new CollectionPersistenceVerifier( { collection: collection } );
			
			// Call the 'load' method with the persistenceVerifier
			var operation = persistenceVerifier.execute.apply( persistenceVerifier, [ loadMethodName ].concat( loadMethodArgs ) );
			
			// Abort (cancel) the LoadOperation
			operation.abort();
			
			// Test that if the request completes after the LoadOperation has been aborted, that it has no effect
			manualProxy.rejectRead( 0 );  // Reject the "read" request that the load operation performed (the first 'read' request), and
			
			persistenceVerifier.verify( 'cancel' );  // verify that the appropriate events/callbacks/handlers were called
		}
		
	} );
	
	return CollectionLoadTester;
	
} );