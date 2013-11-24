/*global define, window, describe, beforeEach, afterEach, it, expect, spyOn */
define( [
	'lodash',
	
	'data/DataComponent',
	
	'data/persistence/proxy/Proxy'
], function( _, DataComponent, Proxy ) {
	
	describe( 'data.DataComponent', function() {
	
		var emptyFn = function() {};
		
		// Concrete subclasses for testing
		var ConcreteDataComponent = DataComponent.extend( {
			getData    : emptyFn,
			isModified : emptyFn,
			commit     : emptyFn,
			rollback   : emptyFn
		} );
		
		var ConcreteProxy = Proxy.extend( {
			create  : emptyFn,
			read    : emptyFn,
			update  : emptyFn,
			destroy : emptyFn
		} );
		Proxy.register( '__DataComponentSpec_ConcreteProxy', ConcreteProxy );
		
		
		describe( "proxy instantiation in static onClassCreate()", function() {
			
			it( "should not affect a DataComponent subclass with no proxy definition", function() {
				expect( function() {
					ConcreteDataComponent.extend( {
						//proxy: {}  -- note: no proxy
					} );
				} ).not.toThrow();
			} );
			
			
			it( "should throw an error when attempting to instantiate an anonymous config object with no `type` property", function() {
				expect( function() {
					ConcreteDataComponent.extend( {
						proxy: {}
					} );
				} ).toThrow( "data.persistence.proxy.Proxy.create(): No `type` property provided on proxy config object" );
			} );
			
			
			it( "should throw an error when attempting to instantiate an anonymous config object with a `type` attribute that does not map to a valid Proxy type", function() {
				expect( function() {
					ConcreteDataComponent.extend( {
						proxy: { type : 'nonexistentproxy' }
					} );
				} ).toThrow( "data.persistence.proxy.Proxy.create(): Unknown Proxy type: 'nonexistentproxy'" );
			} );
			
			
			it( "should instantiate a Proxy with a valid anonymous config object onto the class's prototype", function() {
				var Subclass = ConcreteDataComponent.extend( {
					proxy : {
						type : '__DataComponentSpec_ConcreteProxy'
					}
				} );
				
				expect( Subclass.prototype.proxy instanceof ConcreteProxy ).toBe( true );
			} );
			
			
			it( "should instantiate anonymous config objects at each level of a hierarchy of DataComponents into Proxy instances", function() {
				var Subclass1 = ConcreteDataComponent.extend( {
					proxy : {
						type : '__DataComponentSpec_ConcreteProxy',
						name : "a"  // not a real Proxy config - just a property for use with the tests
					}
				} );
				
				expect( Subclass1.prototype.proxy instanceof ConcreteProxy ).toBe( true );
				expect( Subclass1.prototype.proxy.name ).toBe( "a" );
				
				
				var Subclass2 = Subclass1.extend( {
					proxy : {
						type : '__DataComponentSpec_ConcreteProxy',
						name : "b"  // not a real Proxy config - just a property for use with the tests
					}
				} );
				
				expect( Subclass2.prototype.proxy instanceof ConcreteProxy ).toBe( true );
				expect( Subclass2.prototype.proxy.name ).toBe( "b" );
				
				
				var Subclass3 = Subclass2.extend( {
					// note: no proxy on this one - should inherit from superclass
				} );
				
				expect( Subclass3.prototype.proxy instanceof ConcreteProxy ).toBe( true );
				expect( Subclass3.prototype.proxy.name ).toBe( "b" );
				
				var Subclass4 = Subclass3.extend( {
					proxy : {
						type : '__DataComponentSpec_ConcreteProxy',
						name : "d"  // not a real Proxy config - just a property for use with the tests
					}
				} );
				
				expect( Subclass4.prototype.proxy instanceof ConcreteProxy ).toBe( true );
				expect( Subclass4.prototype.proxy.name ).toBe( "d" );
			} );
			
			
			it( "should leave an instantiated Proxy as-is (i.e. not try to instantiate it again, thinking that it's an anonymous config object)", function() {
				var proxy = new ConcreteProxy();
				
				var Subclass = ConcreteDataComponent.extend( {
					proxy : proxy
				} );
				
				expect( Subclass.prototype.proxy ).toBe( proxy );
			} );
		
		} );
		
		
		
		describe( 'static getProxy()', function() {
			
			it( "should return `null` when no proxy is configured on the DataComponent subclass", function() {
				var SubclassDataComponent = ConcreteDataComponent.extend( {
					// proxy : proxy  -- note: no proxy
				} );
				
				expect( SubclassDataComponent.getProxy() ).toBe( null );
			} );
			
			
			it( "should retrieve a proxy configured on a DataComponent subclass", function() {
				var proxy = new ConcreteProxy();
				
				var SubclassDataComponent = ConcreteDataComponent.extend( {
					proxy : proxy
				} );
				
				expect( SubclassDataComponent.getProxy() ).toBe( proxy );
			} );
			
			
			it( "should retrieve a proxy configured on a parent DataComponent subclass, from within a child DataComponent subclass", function() {
				var proxy = new ConcreteProxy();
				
				var SubclassDataComponent = ConcreteDataComponent.extend( {
					proxy : proxy
				} );
				var SubclassDataComponent2 = SubclassDataComponent.extend( {} );
				
				expect( SubclassDataComponent2.getProxy() ).toBe( proxy );
			} );
			
			
			it( "should return an instantiated proxy even when the proxy was defined as an anonymous proxy configuration object", function() {
				var SubclassDataComponent = ConcreteDataComponent.extend( {
					proxy : {
						type : '__DataComponentSpec_ConcreteProxy'
					}
				} );
				
				var proxy = SubclassDataComponent.getProxy();
				expect( proxy instanceof ConcreteProxy ).toBe( true );
				
				// Make sure the same proxy is retrieved the second time getProxy() is called
				expect( SubclassDataComponent.getProxy() ).toBe( proxy );
			} );
			
		} );
		
		
		describe( 'static normalizePeristenceOptions()', function() {
			var optionsProperties = [ 'success', 'error', 'cancel', 'progress', 'complete' ];
			
			it( "should return an object with the defaults filled in if `undefined` is passed to it", function() {
				var options = DataComponent.normalizePersistenceOptions( undefined );
				
				// Check that empty functions were filled in for each of the properties
				_.forEach( optionsProperties, function( prop ) {
					expect( _.isFunction( options[ prop ] ) ).toBe( true );
				} );
			} );
			
			
			it( "should return an object with the defaults filled in if `null` is passed to it", function() {
				var options = DataComponent.normalizePersistenceOptions( null );
				
				// Check that empty functions were filled in for each of the properties
				_.forEach( optionsProperties, function( prop ) {
					expect( _.isFunction( options[ prop ] ) ).toBe( true );
				} );
			} );
			
			
			it( "should return an object with the defaults filled in if an empty object is passed to it", function() {
				var options = DataComponent.normalizePersistenceOptions( {} );
				
				// Check that empty functions were filled in for each of the properties
				_.forEach( optionsProperties, function( prop ) {
					expect( _.isFunction( options[ prop ] ) ).toBe( true );
				} );
			} );
			
			
			it( "should return the same object that was passed into it, populating the object instead of creating a new one", function() {
				var inputOptionsObj = {},
				    options = DataComponent.normalizePersistenceOptions( inputOptionsObj );
				
				// Check that empty functions were filled in for each of the properties
				_.forEach( optionsProperties, function( prop ) {
					expect( _.isFunction( options[ prop ] ) ).toBe( true );
				} );
				
				// Check that the method returned the same object that was passed in
				expect( options ).toBe( inputOptionsObj );
			} );
			
			
			it( "should bind the `scope` to each of the provided functions", function() {
				var successScope, errorScope, cancelScope, progressScope, completeScope,
				    scopeObj = {};
				
				var options = DataComponent.normalizePersistenceOptions( {
					success  : function() { successScope = this; },
					error    : function() { errorScope = this; },
					cancel   : function() { cancelScope = this; },
					progress : function() { progressScope = this; },
					complete : function() { completeScope = this; },
					
					scope : scopeObj
				} );
				
				// Execute each callback, and see if they were executed in the correct scope
				_.forEach( optionsProperties, function( prop ) { options[ prop ](); } );
				
				expect( successScope ).toBe( scopeObj );
				expect( errorScope ).toBe( scopeObj );
				expect( cancelScope ).toBe( scopeObj );
				expect( progressScope ).toBe( scopeObj );
				expect( completeScope ).toBe( scopeObj );
			} );
			
			
			it( "should bind the `context` to each of the provided functions, as an alternative to using `scope`", function() {
				var successScope, errorScope, cancelScope, progressScope, completeScope,
				    contextObj = {};
				
				var options = DataComponent.normalizePersistenceOptions( {
					success  : function() { successScope = this; },
					error    : function() { errorScope = this; },
					cancel   : function() { cancelScope = this; },
					progress : function() { progressScope = this; },
					complete : function() { completeScope = this; },
					
					context : contextObj
				} );
				
				// Execute each callback, and see if they were executed in the correct scope
				_.forEach( optionsProperties, function( prop ) { options[ prop ](); } );
				
				expect( successScope ).toBe( contextObj );
				expect( errorScope ).toBe( contextObj );
				expect( cancelScope ).toBe( contextObj );
				expect( progressScope ).toBe( contextObj );
				expect( completeScope ).toBe( contextObj );
			} );
			
		} );
		
		
		describe( 'getClientId()', function() {
			
			it( "should return a string with a new clientId", function() {
				var dc = new ConcreteDataComponent();
				
				var clientId = dc.getClientId();
				expect( _.isString( clientId ) ).toBe( true );
				expect( clientId.length ).toBeGreaterThan( 0 );
			} );
			
			
			it( "should return a unique client ID for each new DataComponent instance", function() {
				var dc1 = new ConcreteDataComponent(),
				    dc2 = new ConcreteDataComponent();
				
				expect( dc1.getClientId() ).not.toBe( dc2.getClientId() );
			} );
			
			
			it( "should return the same client ID for each call to the method on a given instance", function() {
				var dc = new ConcreteDataComponent();
				
				expect( dc.getClientId() ).toBe( dc.getClientId() );
			} );
			
		} );
		
		
		describe( 'setProxy()', function() {
			
			it( "should set a Proxy instance to the DataComponent", function() {
				var proxy = new ConcreteProxy(),
				    dc = new ConcreteDataComponent();
				
				dc.setProxy( proxy );
				expect( dc.proxy ).toBe( proxy );
			} );
			
			
			it( "should set an anonymous poxy configuration object to the DataComponent, without instantiating it. (It will be instantiated lazily by getProxy())", function() {
				var proxyCfg = { type: '__DataComponentSpec_ConcreteProxy' },
				    dc = new ConcreteDataComponent();
				
				dc.setProxy( proxyCfg );
				expect( dc.proxy ).toBe( proxyCfg );
			} );
			
		} );
		
		
		describe( 'getProxy()', function() {
			
			it( "should return `null` when no Proxy has been set", function() {
				var dc = new ConcreteDataComponent();
				
				expect( dc.getProxy() ).toBe( null );
			} );
			
			
			it( "should return a Proxy instance that was set directly to the DataComponent using setProxy()", function() {
				var proxy = new ConcreteProxy(),
				    dc = new ConcreteDataComponent();
				
				dc.setProxy( proxy );
				expect( dc.getProxy() ).toBe( proxy );
			} );
			
			
			it( "should lazily instantiate an anonymous configuration object that was set to the DataComponent, and then return that same Proxy instance from there on in", function() {
				var proxyCfg = { type: '__DataComponentSpec_ConcreteProxy' },
				    dc = new ConcreteDataComponent();
				
				dc.setProxy( proxyCfg );
				
				var proxy = dc.getProxy();
				expect( proxy instanceof ConcreteProxy ).toBe( true );
				
				// Check that the same Proxy instance is returned the second time it's called
				expect( dc.getProxy() ).toBe( proxy );
			} );
			
		} );
		
	} );
	
} );