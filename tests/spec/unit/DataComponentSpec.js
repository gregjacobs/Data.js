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
			rollback   : emptyFn,
			isLoading  : emptyFn
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