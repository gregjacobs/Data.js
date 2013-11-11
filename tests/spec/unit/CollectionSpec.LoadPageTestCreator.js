/*global define, beforeEach, afterEach, it, expect */
define( [
	'lodash',
	
	'data/Collection',
	'spec/unit/CollectionSpec.AbstractLoadTestCreator'
], function( _, Collection, AbstractCollectionLoadTester ) {
	
	/**
	 * @class spec.unit.CollectionSpec.LoadPageTester
	 * @extends spec.unit.CollectionSpec.AbstractLoadTestCreator
	 * 
	 * A class for creating the test cases for testing the {@link data.Collection#loadPage} method.
	 * 
	 * See this class's usage in the {@link spec.unit.CollectionSpec CollectionSpec}.
	 */
	var CollectionLoadPageTester = AbstractCollectionLoadTester.extend( {
		
		/**
		 * Override of superclass method used to add {@link data.Collection#loadPage loadPage} method specific tests.
		 * 
		 * @protected
		 */
		buildTests : function() {
			this._super( arguments );
			
			it( "should throw an error if no `pageSize` config is set on the Collection", _.bind( this.test_shouldThrow_whenNoPageSizeConfigSetOnCollection, this ) );
			it( "should throw an error if no `page` argument is provided to the method", _.bind( this.test_shouldThrow_whenNoPageArgProvided, this ) );
			it( "should call the proxy's read() method with the proper paging configs, and any `params` option provided to the method", _.bind( this.test_shouldCallProxyRead_withProperPagingRequestConfigs, this ) );
			it( "should add the models returned by the data in the proxy by default, when the Collection's `clearOnPageLoad` config is false", _.bind( this.test_shouldAddModelsByDefault_ifCollectionClearOnPageLoadIsFalse, this ) );
			it( "should replace the existing models in the Collection upon load when the Collection's `clearOnPageLoad` config is true", _.bind( this.test_shouldReplaceExistingModels_ifCollectionClearOnPageLoadIsTrue, this ) );
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
			return 'loadPage';
		},
		
		
		/**
		 * Implementation of abstract method to return a default set of arguments to the {@link data.Collection#load} 
		 * method when called.
		 * 
		 * @protected
		 * @return {String}
		 */
		getLoadMethodArgs: function() {
			return [ 1 ];  // page 1
		},
		
		
		// -------------------------------------
		
		
		test_shouldThrow_whenNoPageSizeConfigSetOnCollection : function() {
			var MyCollection = Collection.extend( {
				proxy : this.manualProxy
			} );
			var collection = new MyCollection();
			
			expect( function() {
				collection.loadPage( 1 );
			} ).toThrow( "The `pageSize` config must be set on the Collection to load paged data." );
		},
		
		
		test_shouldThrow_whenNoPageArgProvided : function() {
			var collection = new this.ManualProxyCollection();
			
			expect( function() {
				collection.loadPage();
			} ).toThrow( "'page' argument required for loadPage() method, and must be > 0" );
		},
		
		
		test_shouldCallProxyRead_withProperPagingRequestConfigs : function() {
			var collection = new this.ManualProxyCollection( { pageSize: 50 } ),
			    inputParams = { a : 1 };
			
			collection.loadPage( 10, { params: inputParams } );
			
			// Retrieve the request made to the proxy, and check its properties
			var request = this.manualProxy.getReadRequest( 0 );
			expect( request.getParams() ).toBe( inputParams );
			expect( request.getPage() ).toBe( 10 );
			expect( request.getPageSize() ).toBe( 50 );
			expect( request.getStart() ).toBe( 450 );
			expect( request.getLimit() ).toBe( 50 );
		},
		
		
		test_shouldAddModelsByDefault_ifCollectionClearOnPageLoadIsFalse : function() {
			var MyCollection = this.ManualProxyCollection.extend( {
				pageSize : 2,
				clearOnPageLoad : false
			} );
			
			var collection = new MyCollection( [ { id: 1, name: "John" }, { id: 2, name: "Jane" } ] );
			collection.loadPage( 2 );
			
			this.manualProxy.resolveRead( 0, [ { id: 3, name: "Fred" }, { id: 4, name: "Felicia" } ] );
			expect( collection.getData() ).toEqual( [
				{ id: 1, name: "John" },
				{ id: 2, name: "Jane" },
				{ id: 3, name: "Fred" },
				{ id: 4, name: "Felicia" }
			] );
		},
		
		
		test_shouldReplaceExistingModels_ifCollectionClearOnPageLoadIsTrue : function() {
			var MyCollection = this.ManualProxyCollection.extend( {
				pageSize : 2,
				clearOnPageLoad : true
			} );
			
			var collection = new MyCollection( [ { id: 1, name: "John" }, { id: 2, name: "Jane" } ] );
			collection.loadPage( 2 );
			
			this.manualProxy.resolveRead( 0, [ { id: 3, name: "Fred" }, { id: 4, name: "Felicia" } ] );
			expect( collection.getData() ).toEqual( [
				{ id: 3, name: "Fred" },
				{ id: 4, name: "Felicia" }
			] );
		}
		
	} );
	
	
	return CollectionLoadPageTester;
	
} );