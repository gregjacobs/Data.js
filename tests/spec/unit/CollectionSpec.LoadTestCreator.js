/*global define, beforeEach, afterEach, it, expect */
define( [
	'lodash',
	
	'spec/unit/CollectionSpec.AbstractLoadTestCreator'
], function( _, AbstractCollectionLoadTester ) {
	
	/**
	 * @class spec.unit.CollectionSpec.LoadTester
	 * @extends spec.unit.CollectionSpec.AbstractLoadTestCreator
	 * 
	 * A class for creating the test cases for testing the {@link data.Collection#load} method.
	 * 
	 * See this class's usage in the {@link spec.unit.CollectionSpec CollectionSpec}.
	 */
	var CollectionLoadTester = AbstractCollectionLoadTester.extend( {
		
		/**
		 * Override of superclass method used to add {@link data.Collection#load load} method specific tests.
		 * 
		 * @protected
		 */
		buildTests : function() {
			this._super( arguments );
			
			it( "should delegate to loadPage() when the Collection is configured to use paging (i.e. a `pageSize` config is set)", _.bind( this.test_shouldDelegateToLoadPage_whenPageSizeConfigured, this ) );
		},
		
		
		/**
		 * Implementation of abstract method to return the 'load' method name.
		 * 
		 * @protected
		 * @return {String}
		 */
		getLoadMethodName : function() {
			return 'load';
		},
		
		
		/**
		 * Implementation of abstract method to return a default set of arguments to the {@link data.Collection#load} 
		 * method when called.
		 * 
		 * @protected
		 * @return {String}
		 */
		getLoadMethodArgs: function() {
			return [];
		},
		
		
		// -------------------------------------
		
		
		test_shouldDelegateToLoadPage_whenPageSizeConfigured : function() {
			var loadPageCallCount = 0,
			    inputParams = { a: 1 };
			
			var MyCollection = this.ManualProxyCollection.extend( {
				pageSize : 25,
				
				// Override loadPage, just to see that it's called. loadPage() tests are done elsewhere
				loadPage : function( pageNum, options ) {
					loadPageCallCount++;  // just to make sure that the method is called
					expect( pageNum ).toBe( 1 );
					expect( options.params ).toBe( inputParams );
				}
			} );
			
			
			var myCollection = new MyCollection();
			myCollection.load( { params: inputParams } );
			
			expect( loadPageCallCount ).toBe( 1 );
		}
		
	} );
	
	
	return CollectionLoadTester;
	
} );