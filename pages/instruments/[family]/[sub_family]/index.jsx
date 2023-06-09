import React, { useEffect, useState } from "react";
import { ContactusCard } from "../../../../components/ContactusCard";
import { AntButton } from "../../../../components/controls/AntButton";
import { SliderSlickTwo } from "../../../../components/SliderSlickTwo";
import { BsHeartFill, BsPlusLg } from "react-icons/bs";
import Link from "next/link";
import { IoMdClose } from "react-icons/io";
import { BsHeart, BsFilterRight } from "react-icons/bs";
import { FaCartPlus, FaFilter, FaListUl } from "react-icons/fa";
import { RiDeleteBin6Line, RiMenuUnfoldLine } from "react-icons/ri";
import Breadcrumb, { BreadcrumbItem } from "../../../../components/BreadCrumb";
import { CardTextComponent } from "../../../../components/ExtraContent";
import { CheckboxComp } from "../../../../components/controls/CheckboxComp";
import BreadcrumbSelect from "../../../../components/controls/BreadcrmbSelect";
import {
  getIntrumentsProductsFilter,
  getIntrumentsFilteredProducts,
} from "@actions";
import { useRouter } from "next/router";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import { addProductToCart, addToWishList } from "@store/thunk/cart";
import InfiniteScroll from "react-infinite-scroll-component";

export async function getServerSideProps(context) {
  const slug = context.params.sub_family;
  let { brand, priceFrom, priceTo, status, sort } = context.query;
  let query = Object.assign(
    {},
    brand
      ? {
        brand_id: brand,
      }
      : null,
    status ? { state_id: status } : null,
    priceFrom ? { price_from: priceFrom } : null,
    priceTo ? { price_to: priceTo } : null,
    sort ? { order_by: sort.split("_")[0] } : null,
    sort ? { order_direction: sort.split("_")[1] } : null,
    { page: 1 }
  );

  const filters = await getIntrumentsProductsFilter(slug);
  const products = await getIntrumentsFilteredProducts(slug, query);

  return {
    props: {
      filters: filters?.data || [],
      products: products?.products?.data || [],
      meta: products?.products?.meta,
      categories: products?.categoriesList || [],
      count: products?.productCount || 0,
      categoryTitle: products?.category_title || "",
      instrumentGroups:
        products?.dropdownsGroup?.map((group) => ({
          label: group?.name,
          value: group?.slug,
        })) || [],
      instrumentFamilies:
        products?.categoryMenu?.map((group) => ({
          label: group?.name,
          value: group?.slug,
        })) || [],
    },
  };
}

const SortOptions = [
  {
    value: "price_asc",
    label: "PRIX CROISSANT",
  },
  { value: "price_desc", label: "PRIX DÉCROISSANT" },
  { value: "best_sel", label: "MEILLEURS VENTES " },
  { value: "most_pop", label: "PLUS POPULAIRES" },
];

const Clarinettes = ({
  filters,
  products,
  categories,
  count,
  categoryTitle,
  instrumentGroups,
  instrumentFamilies,
  meta,
}) => {
  console.log({
    filters,
    products,
    categories,
    count,
  });

  const router = useRouter();
  const [productItems, setProductItems] = useState(products || []);
  const [productMeta, setProductMeta] = useState(meta || null);
  const [filterToggleState, setFilterToggleState] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [priceTo, setPriceTo] = useState(router.query.priceFrom || "");
  const [priceFrom, setPriceFrom] = useState(router.query.priceTo || "");
  // const [instrumentGroups, setInstrumentGroups] = useState([]);
  // const [instrumentFamilies, setInstrumentFamilies] = useState([]);
  const query = router.query;

  const updateRouterWithQuery = (q) => {
    router.push({
      pathname: "/instruments/" + query.family + "/" + query.sub_family,
      query: { ...q },
    });
  };

  const handleLoadMore = async () => {
    let payload = {
      ...query,
      page: +productMeta?.current_page + 1,
    };
    const instruments = await getIntrumentsFilteredProducts(
      query?.sub_family,
      payload
    );
    console.log({ instruments });

    setProductItems([...productItems, ...instruments?.products?.data] || []);
    setProductMeta({ ...instruments?.products?.meta });
  };

  const handleChangeFilters = (key, value) => {
    const newquery = { ...query };
    delete newquery.family;
    delete newquery.sub_family;

    let isExistQuery = Object.keys(newquery).includes(key);
    if (isExistQuery) {
      let isValueExist = newquery[key].split(",").includes(value.toString());
      if (!isValueExist) {
        newquery[key] = newquery[key].concat(`,${value}`);
        updateRouterWithQuery(newquery);
      } else {
        let values = newquery[key]
          .split(",")
          .filter((item) => item != value.toString())
          .join(",");
        if (values) {
          newquery[key] = values;
        } else {
          delete newquery[key];
        }
        updateRouterWithQuery(newquery);
      }
    } else {
      let query = {
        ...newquery,
        [key]: value,
      };
      updateRouterWithQuery(query);
    }
  };
  const listener = (event) => {
    if (event.code === "Enter" || event.code === "NumpadEnter") {
      event.preventDefault();
      const newquery = { ...query };
      delete newquery.family;
      delete newquery.sub_family;
      const { name, value } = event.target;
      console.log({ name, value, newquery });
      if (!value) {
        delete newquery[name];
        updateRouterWithQuery(newquery);
      } else {
        newquery[name] = value;
        updateRouterWithQuery(newquery);
      }
    }
  };
  const handleClearFilters = () => {
    router.push({
      pathname: "/instruments/" + query.slug.join("/"),
    });
  };

  const handleSort = (key, value) => {
    const newquery = { ...query };
    delete newquery.family;
    delete newquery.sub_family;
    newquery[key] = value;
    updateRouterWithQuery(newquery);
  };

  return (
    <div className="clarinettes__container position-relative container my-3 my-sm-5">
      <Breadcrumb>
        <BreadcrumbItem href="/instruments">INSTRUMENTs</BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbSelect
            value={
              instrumentGroups?.filter((item) => item.value == query.family)[0]
            }
            placeholder="Instruments"
            options={instrumentGroups}
            getSlug={(slug) => router.push("/instruments/" + slug.value)}
          />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbSelect
            value={
              instrumentFamilies?.filter(
                (item) => item.value == query.sub_family
              )[0]
            }
            placeholder="families"
            options={instrumentFamilies}
          />
        </BreadcrumbItem>
        <BreadcrumbItem isLast>{categoryTitle}</BreadcrumbItem>
      </Breadcrumb>
      <div className="col-12 d-flex flex-wrap mb-5">
        <div className="col-12 col-lg-9">
          <div className="image__container w-100 flex-column p-3 p-sm-5 d-flex justify-content-center">
            <div className="image_heading mb-4 text-uppercase">
              {categoryTitle}
            </div>
            <div className="image_sub_heading">
              INSTRUMENTS DE MUSIQUE & ACCESSOIRES
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-3 ps-0 ps-lg-3 mt-5 mt-lg-0">
          <ContactusCard ContactusCardHeight="h-100" />
        </div>
      </div>

      <div className="col-12 mt-5 d-flex flex-wrap">
        {categories && categories.length > 0
          ? categories.map((category, index) => {
            return (
              <CardContainers
                key={category?.name}
                ctxtOne={category?.name}
                // txtTwo="sib"
                image={category?.image_url}
                // slug={category?.slug}
                slug={`${query?.family}/${query?.sub_family}/${category?.slug}`}
              />
            );
          })
          : null}
      </div>

      <div className="col-12 my-3 my-sm-5 mt-4 m-0 row partition_main_container">
        {showFilterSidebar ? (
          <div className="position-fixed filter_sidebar_hide h-100 d-block p-0 d-lg-none">
            <div className="partition_grey_container p-4">
              <div className="heading_with_filter_icon d-flex align-items-center">
                <FaFilter className="text-dark me-3" />
                <div className="partition_grey_container_heading text-uppercase me-auto">
                  FILTRES
                </div>
                <IoMdClose
                  style={{
                    color: " #000",
                    transform: "translate(16px, -16px)",
                    fontSize: "27px ",
                  }}
                  className="cursor-pointer d-block d-md-none"
                  onClick={() => setShowFilterSidebar((prev) => !prev)}
                />
              </div>
              <button
                onClick={handleClearFilters}
                className="partition_btn_class text-light w-100 d-flex text-uppercase align-items-center justify-content-between my-5"
              >
                <RiDeleteBin6Line style={{ fontSize: "20px" }} />
                supprimer la sélection
              </button>
              <div className="partition_grey_container_heading text-uppercase my-4 ">
                instruments
              </div>
              {filters && filters?.brandsData?.length > 0
                ? filters?.brandsData?.map((brand, index) => (
                  <CheckboxComp
                    checked={query.brand
                      ?.split(",")
                      .includes(brand.id.toString())}
                    onChange={() => handleChangeFilters("brand", brand.id)}
                    key={brand?.name + index}
                    checkTxt={`${brand?.name} (${brand?.count})`}
                  />
                ))
                : null}
              <div className="partition_grey_container_heading text-uppercase my-4 ">
                etat
              </div>

              {filters && filters?.stateData?.length > 0
                ? filters?.stateData?.map((state, index) => (
                  <CheckboxComp
                    checked={query.status
                      ?.split(",")
                      .includes(state.state_id.toString())}
                    onChange={() =>
                      handleChangeFilters("status", state.state_id)
                    }
                    key={state?.name + index}
                    checkTxt={`${state?.name} (${state?.count})`}
                  />
                ))
                : null}
              <div className="partition_grey_container_heading text-uppercase my-4">
                prix
              </div>
              <div className="col-12 row">
                <div className="col-6 text-dark">
                  <div className="mb-1 text-uppercase">de</div>
                  <input
                    onKeyDown={listener}
                    id="1"
                    key={"priceFrom"}
                    name="priceFrom"
                    type="number"
                    className="w-100 input_dash_class"
                  />
                </div>
                <div className="col-6">
                  <div className="text-dark text-uppercase mb-1">à</div>
                  <input
                    onKeyDown={listener}
                    id="2"
                    key={"priceTo"}
                    name="priceTo"
                    type="number"
                    className="w-100 input_dash_class"
                  />
                </div>
              </div>
              <div className="partition_grey_container_heading text-uppercase my-4">
                offre produit
              </div>

              {/* <CheckboxComp checkTxt="Soldes (11)" />
              <CheckboxComp checkTxt="Vente Flash (8)" /> */}
            </div>
          </div>
        ) : null}
        <div className="d-none d-lg-block col-lg-3">
          <div className="partition_grey_container p-4">
            <div className="heading_with_filter_icon d-flex align-items-center">
              <FaFilter className="text-dark me-3" />
              <div className="partition_grey_container_heading text-uppercase">
                FILTRES
              </div>
            </div>
            <button
              onClick={handleClearFilters}
              className="partition_btn_class text-light w-100 d-flex text-uppercase align-items-center justify-content-between my-5"
            >
              <RiDeleteBin6Line style={{ fontSize: "20px" }} />
              supprimer la sélection
            </button>

            <div className="partition_grey_container_heading text-uppercase my-4 ">
              instruments
            </div>

            {filters && filters?.brandsData?.length > 0
              ? filters?.brandsData?.map((brand, index) => (
                <CheckboxComp
                  checked={query.brand
                    ?.split(",")
                    .includes(brand.id.toString())}
                  onChange={() => handleChangeFilters("brand", brand.id)}
                  key={brand?.name + index}
                  checkTxt={`${brand?.name} (${brand?.count})`}
                />
              ))
              : null}
            <div className="partition_grey_container_heading text-uppercase my-4 ">
              etat
            </div>

            {filters && filters?.stateData?.length > 0
              ? filters?.stateData?.map((state, index) => (
                <CheckboxComp
                  checked={query.status
                    ?.split(",")
                    .includes(state.state_id.toString())}
                  onChange={() =>
                    handleChangeFilters("status", state.state_id)
                  }
                  key={state?.name + index}
                  checkTxt={`${state?.name} (${state?.count})`}
                />
              ))
              : null}
            <div className="partition_grey_container_heading text-uppercase my-4">
              prix
            </div>
            <div className="col-12 row">
              <div className="col-6 text-dark">
                <div className="mb-1 text-uppercase">de</div>
                <input
                  onKeyDown={listener}
                  id="1"
                  key={"priceFrom"}
                  name="priceFrom"
                  type="number"
                  className="w-100 input_dash_class"
                />
              </div>
              <div className="col-6">
                <div className="text-dark text-uppercase mb-1">à</div>
                <input
                  onKeyDown={listener}
                  id="2"
                  key={"priceTo"}
                  name="priceTo"
                  type="number"
                  className="w-100 input_dash_class"
                />
              </div>
            </div>
            <div className="partition_grey_container_heading text-uppercase my-4">
              offre produit
            </div>

            {/* <CheckboxComp checkTxt="Soldes (11)" />
            <CheckboxComp checkTxt="Vente Flash (8)" /> */}
          </div>
        </div>

        <div className="clarinettes_filter_result_container row col-12 col-lg-9">
          <div className="clarinettes_filter_result_count_card mb-3 mb-sm-5 d-flex flex-column flex-sm-row justify-content-between align-items-center">
            <div className="clarinettes_filter_result_left_side d-flex">
              <RiMenuUnfoldLine
                onClick={() => setShowFilterSidebar((prev) => !prev)}
                style={{ fontSize: "22px" }}
                className="theme_primary_color me-2 cursor-pointer d-block d-lg-none"
              />
              <div className="clarinettes_filter_result_count theme_primary_color me-2">
                {count}
              </div>
              <div className="clarinettes_filter_result_text text-dark">
                RÉSULTATS
              </div>
            </div>
            <div className="clarinettes_filter_result_right_side d-flex align-items-center">
              <BsFilterRight
                className="text-dark me-2 mb-3 mb-sm-0"
                style={{ transform: "rotate(180deg)", fontSize: "20px" }}
              />
              <div className="jost_font clarinettes_filter_button_text text-dark text-uppercase mb-3 mb-sm-0">
                trier:
              </div>
              <Select
                styles={{
                  control: (baseStyles, state) => ({
                    ...baseStyles,
                    border: 0,
                    outline: 0,
                  }),
                  dropdownIndicator: (baseStyles, state) => ({
                    ...baseStyles,
                    color: "#000",
                  }),
                  option: (styles, { isFocused, isSelected }) => ({
                    ...styles,
                    color: isSelected ? "#fff" : "#000",
                    zIndex: 1,
                  }),
                }}
                value={
                  SortOptions.filter(
                    (item) =>
                      item.value == (query?.sort ? query?.sort : "price_desc")
                  )[0]
                }
                options={SortOptions}
                components={{
                  IndicatorSeparator: () => null,
                }}
                onChange={(e) => handleSort("sort", e.value)}
              />
              <FaListUl
                className={`text-dark ms-3 cursor-pointer ${filterToggleState ? "theme_primary_color" : null
                  } mb-3 mb-sm-0`}
                onClick={() => setFilterToggleState((prevState) => !prevState)}
                style={{ fontSize: "20px" }}
              />
            </div>
          </div>
          <InfiniteScroll
            dataLength={productItems?.length || 0}
            next={handleLoadMore}
            hasMore={productMeta?.current_page !== productMeta?.last_page}
            loader={
              <div className="d-flex align-items-center justify-content-center">
                <span className="loader"></span>
              </div>
            }
          >
            {!filterToggleState ? (
              <div className="d-flex flex-column">
                {productItems && productItems.length > 0
                  ? productItems?.map((product, index) => (
                    <ColComp
                      productId={product?.product_id}
                      key={product?.title}
                      elTitle={product?.brand}
                      elSubTitle={product?.title}
                      elText={product?.category}
                      // discPercentage="20%"
                      newPrice={
                        product?.promo_price
                          ? product?.promo_price
                          : product?.price
                      }
                      discPercentage={product?.discount}
                      image={product?.image}
                      oldPrice={product?.promo_price ? product?.price : false}
                      // countPrice="6 X 119,33€"
                      slug={`${product?.slug}`}
                    />
                  ))
                  : "no product found"}
              </div>
            ) : null}
            {filterToggleState ? (
              <div className="col-12 d-flex flex-wrap">
                {productItems && productItems.length > 0 ? (
                  productItems?.map((product, index) => (
                    <RowComp
                      productId={product?.product_id}
                      key={product?.title}
                      elTitle={product?.brand}
                      elSubTitle={product?.title}
                      elText={product?.category}
                      // discPercentage="20%"
                      discPercentage={product?.discount}
                      newPrice={
                        product?.promo_price
                          ? product?.promo_price
                          : product?.price
                      }
                      oldPrice={product?.promo_price ? product?.price : false}
                      image={product?.image}
                      // countPrice="6 X 119,33€"
                      slug={`${product?.slug}`}
                    />
                  ))
                ) : (
                  <p>No Product Found</p>
                )}
              </div>
            ) : null}
          </InfiniteScroll>

          <div className="clarinettes_filter_result_card mb-3 d-flex justify-content-between"></div>
        </div>
      </div>

      <SliderSlickTwo slidesToShowNum={6} />
      <div className="d-flex justify-content-center mt-4 align-items-center">
        <AntButton btnTxt="VOIR TOUTES LES MARQUES" />
      </div>
    </div>
  );
};

export default Clarinettes;

const ColComp = ({
  elTitle,
  elSubTitle,
  elText,
  discPercentage,
  newPrice,
  oldPrice,
  countPrice,
  image,
  slug,
  productId,
}) => {
  const dispatch = useDispatch();

  const wishList = useSelector(state => state.cart.wishList)


  const addProductWishList = async (productId) => {
    dispatch(addToWishList(productId))
  }

  const addToCart = (productId) => {
    console.log("Col");
    let object = {
      product_id: productId,
      quantity: 1,
      type: 1,
    };
    dispatch(addProductToCart(object));
  };

  return (
    <div className="clarinettes_filter_result_card cursor-pointer mb-3 d-flex justify-content-between">
      <div className="clarinettes_filter_result_image_card d-flex">
        <div className="clarinettes_filter_image d-flex align-items-center">
          <img src={image} alt={elTitle} />
        </div>
        <div className="clarinettes_filter_image_content d-flex flex-column justify-content-center ms-2 ms-sm-4">
          <div className="clarinettes_filter_main_heading jost_font text-dark text-uppercase">
            <Link href={"/products/" + slug} passHref>
              <a className="clarinettes_filter_main_heading jost_font text-dark text-uppercase">
                {elTitle}
              </a>
            </Link>
          </div>
          <div className="clarinettes_filter_featured_text_one jost_font text-dark text-uppercase">
            {elSubTitle}
          </div>
          <div className="clarinettes_filter_featured_text_two jost_font text-dark">
            {elText}
          </div>
        </div>
      </div>
      <div className="clarinettes_filter_result_price_card d-flex">
        {discPercentage ? (
          <div className="prod_result_dicount_card jost_font  px-1 px-sm-3 d-flex align-items-center ms-1 ms-sm-0 me-0 me-sm-5">
            -{discPercentage}%
          </div>
        ) : null}
        <div className="f-flex ps-2 ps-sm-5">
          <div className="prod_featured_price theme_primary_color">
            {newPrice}
          </div>
          <div className="prod_old_price my-1">{oldPrice}</div>
          {countPrice && (
            <div className="clarinettes_filter_price_multiply_contianer d-flex">
              <div className="clarinettes_filter_price_multiply_black text-dark me-1">
                OU
              </div>
              <div className="clarinettes_filter_price_multiply_theme theme_primary_color">
                {countPrice}
              </div>
            </div>
          )}

          <div className="clarinettes_filter_price_cart d-flex theme_primary_color mt-3">
            {
              wishList.includes(productId) ? <BsHeartFill size={18} className="cursor-pointer me-3" onClick={() => addProductWishList(productId)} /> :
                <BsHeart size={18} className="cursor-pointer me-3" onClick={() => addProductWishList(productId)} />
            }
            <FaCartPlus onClick={() => addToCart(productId)} />
          </div>
        </div>
      </div>
    </div>
  );
};

const RowComp = ({
  elTitle,
  elSubTitle,
  elText,
  discPercentage,
  newPrice,
  countPrice,
  image,
  slug,
  oldPrice,
  productId,
}) => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.common.loading);

  const wishList = useSelector(state => state.cart.wishList)


  const addProductWishList = async (productId) => {
    dispatch(addToWishList(productId))
  }

  const addToCart = (productId) => {
    console.log("Col");
    let object = {
      product_id: productId,
      quantity: 1,
      type: 1,
    };

    dispatch(addProductToCart(object));
  };
  return (
    <div className="clarinettes_filter_result_card cursor-pointer mb-3 d-flex flex-column col-6 col-sm-4 col-md-3 px-1 px-sm-3 pb-3">
      <div className="clarinettes_filter_result_image_card d-flex flex-column">
        <div className="clarinettes_filter_image d-flex mb-3 position-relative">
          <div className="plus_container position-absolute fw-bold text-center">
            <BsPlusLg />
          </div>
          <img src={image} alt={elTitle} />
          {discPercentage ? (
            <div className="prod_dicount_row_card jost_font d-flex align-items-center justify-content-center">
              -{discPercentage}%
            </div>
          ) : null}
        </div>
        <div className="clarinettes_filter_image_content d-flex flex-column justify-content-center">
          <div className="clarinettes_filter_main_heading jost_font text-dark text-uppercase">
            <Link href={"/products/" + slug} passHref>
              <a className="clarinettes_filter_main_heading jost_font text-dark text-uppercase">
                {elTitle}
              </a>
            </Link>
          </div>
          <div className="clarinettes_filter_featured_text_one jost_font text-dark text-uppercase">
            {elSubTitle}
          </div>
          <div className="clarinettes_filter_featured_text_two jost_font text-dark">
            {elText}
          </div>
        </div>
      </div>
      <div className="clarinettes_filter_result_price_card d-flex align-items-center justify-content-between">
        <div className="d-flex flex-column">
          <div className="prod_featured_price theme_primary_color mb-1">
            {newPrice}
          </div>
          <div className="prod_old_price my-1">{oldPrice}</div>
          {countPrice && (
            <div className="clarinettes_filter_price_multiply_contianer d-flex">
              <div className="clarinettes_filter_price_multiply_black text-dark me-1">
                OU
              </div>
              <div className="clarinettes_filter_price_multiply_theme theme_primary_color">
                {countPrice}
              </div>
            </div>
          )}
        </div>
        <div className="clarinettes_filter_price_cart d-flex flex-column theme_primary_color ms-3">
          {
            wishList.includes(productId) ? <BsHeartFill size={18} className="cursor-pointer me-3" onClick={() => addProductWishList(productId)} /> :
              <BsHeart size={18} className="cursor-pointer me-3" onClick={() => addProductWishList(productId)} />
          }
          <FaCartPlus onClick={() => addToCart(productId)} />
        </div>
      </div>
    </div>
  );
};

const CardContainers = ({ ctxtOne, txtTwo, image, slug }) => (
  <div className="col-12 col-sm-6 col-md-6 col-lg-3 mb-3 pe-sm-3">
    <div className="sub_category_container">
      <Link passHref href={"/instruments/" + slug}>
        <a className="text-decoration-none">
          <div className="d-flex align-items-center justify-content-between h-100">
            <img src={image} alt={ctxtOne} className="h-100" />
            <div className="card_content_container h-100 w-100">
              <div className="d-flex align-items-center h-100">
                <CardTextComponent
                  cardClass="align-items-end ms-3 me-2 card_content_container-text"
                  ctxtOne={ctxtOne}
                  txtTwo={txtTwo}
                />
              </div>
            </div>
          </div>
        </a>
      </Link>
    </div>
  </div>
);
