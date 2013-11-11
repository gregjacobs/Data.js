/*global define, beforeEach, afterEach, it, expect */
define( [
	'lodash',
	
	'data/Collection',
	'spec/unit/CollectionSpec.AbstractLoadTestCreator'
], function( _, Collection, AbstractCollectionLoadTester ) {
	
	/**
	 * @class spec.unit.CollectionSpec.LoadPageRangeTester
	 * @extends spec.unit.CollectionSpec.AbstractLoadTestCreator
	 * 
	 * A class for creating the test cases for testing the {@link data.Collection#loadPageRange} method.
	 * 
	 * See this class's usage in the {@link spec.unit.CollectionSpec CollectionSpec}.
	 */
	var CollectionLoadPageRangeTester = AbstractCollectionLoadTester.extend( {
		
		/**
		 * Override of superclass method used to add {@link data.Collection#loadPageRange loadPageRange} method specific tests.
		 * 
		 * @protected
		 */
		buildTests : function() {
			this._super( arguments );
			
			it( "should throw an error if no `pageSize` config is set on the Collection", _.bind( this.test_shouldThrow_whenNoPageSizeConfigSetOnCollection, this ) );
			it( "should throw an error if no `startPage` argument is provided to the method", _.bind( this.test_shouldThrow_whenNoStartPageArgProvided, this ) );
			it( "should throw an error if no `endPage` argument is provided to the method", _.bind( this.test_shouldThrow_whenNoEndPageArgProvided, this ) );
			
			it( "should call the proxy's read() method, once for each page that needs to be loaded, when the proxy is configured on the Collection", _.bind( this.test_shouldCallProxyRead_onceForEachpage, this ) );
			it( "should call the proxy's read() method with the proper paging configs, and any `params` option provided to the method", _.bind( this.test_shouldCallProxyReadWithProperPagingConfigs, this ) );
			
			it( "should cause isLoading() to return `true` while loading data, and back to false when finished with a successful load of *all* pages", _.bind( this.test_shouldCauseIsLoadingToReturnTrue_whileLoadingPages, this ) );
			it( "should cause isLoading() to return `true` while loading data, and back to false when finished an errored load of even just one of the pages", _.bind( this.test_shouldCauseIsLoadingToReturnFalse_afterFirstErroredRequest, this ) );
			
			it( "should load the models returned by the data in the proxy, in the order of the page requests", _.bind( this.test_shouldLoadModelsInOrderOfRequests_evenIfResolvedOutOfOrder, this ) );
			it( "should add the models returned by the data in the proxy, when the 'addModels' option is set to true", _.bind( this.test_shouldAddModels_whenAddModelsOptionIsTrue, this ) );
			it( "should add the models returned by the data in the proxy by default, when the Collection's `clearOnPageLoad` config is false", _.bind( this.test_shouldAddModels_whenCollectionClearOnPageLoadIsFalse, this ) );
			it( "should replace the existing models in the Collection upon load when the Collection's `clearOnPageLoad` config is true", _.bind( this.test_shouldReplaceExistingModels_whenCollectionClearOnPageLoadIsTrue, this ) );
		},
		
		
		/**
		 * Override of superclass method used to retrieve the default config that should be applied to the Collection 
		 * subclass that is created for the tests. 
		 * 
		 * This implementation is to add the {@link data.Collection#pageSize} config to the Collection that is being 
		 * tested.
		 * 
		 * @protected
		 * @method getDefaultCollectionConfig
		 * @return {Object} An Object (map) of the default configuration for the Collection.
		 */
		getDefaultCollectionConfig : function() {
			return { 
				pageSize: 5
			};
		},
		
		
		/**
		 * Implementation of abstract method to return the 'load' method name.
		 * 
		 * @protected
		 * @return {String}
		 */
		getLoadMethodName : function() {
			return 'loadPageRange';
		},
		
		
		/**
		 * Implementation of abstract method to return a default set of arguments to the {@link data.Collection#load} 
		 * method when called.
		 * 
		 * @protected
		 * @return {String}
		 */
		getLoadMethodArgs: function() {
			return [ 1, 1 ];  // page 1 only for generalized tests in superclass
		},
		
		
		// -------------------------------------
		
		
		test_shouldThrow_whenNoPageSizeConfigSetOnCollection : function() {
			var MyCollection = Collection.extend( {
				proxy : this.manualProxy
			} );
			var collection = new MyCollection();
			
			expect( function() {
				collection.loadPageRange( 1, 2 );
			} ).toThrow( "The `pageSize` config must be set on the Collection to load paged data." );
		},
		
		
		test_shouldThrow_whenNoStartPageArgProvided : function() {
			var collection = new this.ManualProxyCollection();
			
			expect( function() {
				collection.loadPageRange();  // missing startPage arg
			} ).toThrow( "`startPage` and `endPage` arguments required for loadPageRange() method, and must be > 0" );
		},
		
		
		test_shouldThrow_whenNoEndPageArgProvided : function() {
			var collection = new this.ManualProxyCollection();
			
			expect( function() {
				collection.loadPageRange( 1 );  // missing endPage arg
			} ).toThrow( "`startPage` and `endPage` arguments required for loadPageRange() method, and must be > 0" );
		},
		
		
		test_shouldCallProxyRead_onceForEachpage : function() {
			var collection = new this.ManualProxyCollection();
			collection.loadPageRange( 1, 3 );
			
			expect( this.manualProxy.getReadRequestCount() ).toBe( 3 );
		},
		
		
		test_shouldCallProxyReadWithProperPagingConfigs : function() {
			var collection = new this.ManualProxyCollection( { pageSize: 10 } ),
			    inputParams = { a: 1 };
			
			collection.loadPageRange( 1, 3, { params: inputParams } );
			expect( this.manualProxy.getReadRequestCount() ).toBe( 3 );  // Proxy should have been called 3 times, creating 3 request objects
			
			var request0 = this.manualProxy.getReadRequest( 0 );
			expect( request0.getParams() ).toBe( inputParams );
			expect( request0.getPage() ).toBe( 1 );
			expect( request0.getPageSize() ).toBe( 10 );
			expect( request0.getStart() ).toBe( 0 );
			expect( request0.getLimit() ).toBe( 10 );
			
			var request1 = this.manualProxy.getReadRequest( 1 );
			expect( request1.getParams() ).toBe( inputParams );
			expect( request1.getPage() ).toBe( 2 );
			expect( request1.getPageSize() ).toBe( 10 );
			expect( request1.getStart() ).toBe( 10 );
			expect( request1.getLimit() ).toBe( 10 );
			
			var request2 = this.manualProxy.getReadRequest( 2 );
			expect( request2.getParams() ).toBe( inputParams );
			expect( request2.getPage() ).toBe( 3 );
			expect( request2.getPageSize() ).toBe( 10 );
			expect( request2.getStart() ).toBe( 20 );
			expect( request2.getLimit() ).toBe( 10 );
		},
		
		 
		test_shouldCauseIsLoadingToReturnTrue_whileLoadingPages : function() {
			var collection = new this.ManualProxyCollection();
			expect( collection.isLoading() ).toBe( false );  // initial condition
			
			// Make requests for 2 pages
			collection.loadPageRange( 1, 2 );
			expect( collection.isLoading() ).toBe( true );
			
			// Resolve the first Request and check
			this.manualProxy.resolveRead( 0, { id: 1, name: "John" } );
			expect( collection.isLoading() ).toBe( true );
			
			// Now resolve the second Request. The collection should now no longer be considered loading.
			this.manualProxy.resolveRead( 1, { id: 2, name: "Jane" } );
			expect( collection.isLoading() ).toBe( false );
		},
		
		
		test_shouldCauseIsLoadingToReturnFalse_afterFirstErroredRequest : function() {
			var collection = new this.ManualProxyCollection();
			expect( collection.isLoading() ).toBe( false );  // initial condition
			
			// Make requests for 2 pages
			collection.loadPageRange( 1, 3 );
			expect( collection.isLoading() ).toBe( true );
			
			// Resolve the first Request and check
			this.manualProxy.resolveRead( 0, { id: 1, name: "John" } );
			expect( collection.isLoading() ).toBe( true );
			
			// Reject the second Request (simulating an error) and check
			this.manualProxy.rejectRead( 1 );
			expect( collection.isLoading() ).toBe( false );
		},
		
		
		test_shouldLoadModelsInOrderOfRequests_evenIfResolvedOutOfOrder : function() {
			var collection = new this.ManualProxyCollection( { pageSize: 2 } );
			collection.loadPageRange( 1, 3 );
			
			// Resolve the requests out of order
			this.manualProxy.resolveRead( 2, [ { id: 5, name: "Andy" }, { id: 6, name: "Sarah" } ] );
			this.manualProxy.resolveRead( 0, [ { id: 1, name: "John" }, { id: 2, name: "Jane" } ] );
			this.manualProxy.resolveRead( 1, [ { id: 3, name: "Greg" }, { id: 4, name: "Jeff" } ] );
			
			// Check that the data loaded into the collection is in the correct order
			expect( collection.getData() ).toEqual( [
				{ id: 1, name: "John" },
				{ id: 2, name: "Jane" },
				{ id: 3, name: "Greg" },
				{ id: 4, name: "Jeff" },
				{ id: 5, name: "Andy" },
				{ id: 6, name: "Sarah" }
			] );
		},
		
		
		test_shouldAddModels_whenAddModelsOptionIsTrue : function() {
			var collection = new this.ManualProxyCollection( {
				data     : [ { id: 1, name: "John" }, { id: 2, name: "Jane" } ],
				pageSize : 2
			} );
			collection.loadPageRange( 2, 3, { addModels: true } );
			
			// Resolve the requests
			this.manualProxy.resolveRead( 0, [ { id: 3, name: "Greg" }, { id: 4, name: "Jeff" } ] );
			this.manualProxy.resolveRead( 1, [ { id: 5, name: "Andy" }, { id: 6, name: "Sarah" } ] );
			
			// Check that the data loaded into the collection is in the correct order
			expect( collection.getData() ).toEqual( [
				{ id: 1, name: "John" },
				{ id: 2, name: "Jane" },
				{ id: 3, name: "Greg" },
				{ id: 4, name: "Jeff" },
				{ id: 5, name: "Andy" },
				{ id: 6, name: "Sarah" }
			] );
		},
		
		
		
		test_shouldAddModels_whenCollectionClearOnPageLoadIsFalse : function() {
			var collection = new this.ManualProxyCollection( {
				data : [ { id: 1, name: "John" }, { id: 2, name: "Jane" } ],
				
				pageSize : 2,
				clearOnPageLoad : false
			} );
			collection.loadPageRange( 2, 3 );
			
			// Resolve the requests
			this.manualProxy.resolveRead( 0, [ { id: 3, name: "Greg" }, { id: 4, name: "Jeff" } ] );
			this.manualProxy.resolveRead( 1, [ { id: 5, name: "Andy" }, { id: 6, name: "Sarah" } ] );
			
			// Check that the data loaded into the collection is in the correct order
			expect( collection.getData() ).toEqual( [
				{ id: 1, name: "John" },
				{ id: 2, name: "Jane" },
				{ id: 3, name: "Greg" },
				{ id: 4, name: "Jeff" },
				{ id: 5, name: "Andy" },
				{ id: 6, name: "Sarah" }
			] );
		},
		
		 
		test_shouldReplaceExistingModels_whenCollectionClearOnPageLoadIsTrue : function() {
			var collection = new this.ManualProxyCollection( {
				data : [ { id: 1, name: "John" }, { id: 2, name: "Jane" } ],
				
				pageSize : 2,
				clearOnPageLoad : true
			} );
			collection.loadPageRange( 2, 3 );
			
			// Resolve the requests
			this.manualProxy.resolveRead( 0, [ { id: 3, name: "Greg" }, { id: 4, name: "Jeff" } ] );
			this.manualProxy.resolveRead( 1, [ { id: 5, name: "Andy" }, { id: 6, name: "Sarah" } ] );
			
			// Check that the data loaded into the collection is in the correct order
			expect( collection.getData() ).toEqual( [
				{ id: 3, name: "Greg" },
				{ id: 4, name: "Jeff" },
				{ id: 5, name: "Andy" },
				{ id: 6, name: "Sarah" }
			] );
		}
		
	} );
	
	
	return CollectionLoadPageRangeTester;
	
} );