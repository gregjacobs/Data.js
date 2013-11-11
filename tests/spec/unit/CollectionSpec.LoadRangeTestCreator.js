/*global define, beforeEach, afterEach, it, expect */
define( [
	'lodash',
	
	'spec/unit/CollectionSpec.AbstractLoadTestCreator'
], function( _, AbstractCollectionLoadTester ) {
	
	/**
	 * @class spec.unit.CollectionSpec.LoadRangeTester
	 * @extends spec.unit.CollectionSpec.AbstractLoadTestCreator
	 * 
	 * A class for creating the test cases for testing the {@link data.Collection#loadRange} method.
	 * 
	 * See this class's usage in the {@link spec.unit.CollectionSpec CollectionSpec}.
	 */
	var CollectionLoadRangeTester = AbstractCollectionLoadTester.extend( {
		
		/**
		 * Override of superclass method used to add {@link data.Collection#loadRange loadRange} method specific tests.
		 * 
		 * @protected
		 */
		buildTests : function() {
			this._super( arguments );
			
			it( "should delegate to the loadPageRange() method when the Collection is configured to load paged data (i.e. a `pageSize` config is set)", _.bind( this.test_shouldDelegateToLoadPageRange_whenPageSizeConfigured, this ) );
		},
		
		
		/**
		 * Implementation of abstract method to return the 'loadRange' method name.
		 * 
		 * @protected
		 * @return {String}
		 */
		getLoadMethodName : function() {
			return 'loadRange';
		},
		
		
		/**
		 * Implementation of abstract method to return a default set of arguments to the {@link data.Collection#loadRange} 
		 * method when called.
		 * 
		 * @protected
		 * @return {String}
		 */
		getLoadMethodArgs: function() {
			return [ 0, 9 ];
		},
		
		
		// -------------------------------------
		
		
		test_shouldDelegateToLoadPageRange_whenPageSizeConfigured : function() {
			var loadPageRangeCallCount = 0,
			    inputParams = { a: 1 };
			
			var MyCollection = this.ManualProxyCollection.extend( {
				pageSize : 5,
				
				// Override loadPageRange, just to see that it's called. loadPageRange() tests are done elsewhere
				loadPageRange : function( startPage, endPage, options ) {
					loadPageRangeCallCount++;  // to make sure the method was called
					
					expect( startPage ).toBe( 1 );
					expect( endPage ).toBe( 3 );  // even though we only want up to record #12, we need page 3 to cover the 10-15 range
					expect( options.params ).toBe( inputParams );
				}
			} );
			
			new MyCollection().loadRange( 0, 12, { params: inputParams } );
			expect( loadPageRangeCallCount ).toBe( 1 );
		}
		
	} );
	
	
	return CollectionLoadRangeTester;
	
} );