import { useMemo } from "react";
import { TbTrash } from "react-icons/tb";
import { ActionIcon, Center, Table, Title } from "@mantine/core";

import { useDeleteOrderMutation, useGetMyOrdersQuery } from "../../store/api";

interface OrdersProps {
  coinId?: number;
}

function Orders({ coinId }: OrdersProps) {
  const { data: allOrders = [] } = useGetMyOrdersQuery();
  const [deleteOrder] = useDeleteOrderMutation();

  const orders = useMemo(() => {
    return allOrders.filter((order) => {
      return order.coinId === coinId && !order.filled;
    });
  }, [coinId, allOrders]);

  if (orders.length === 0)
    return (
      <Center>
        <Title order={3}>No active orders</Title>
      </Center>
    );

  const rows = orders.map((order) => (
    <Table.Tr key={order.id}>
      <Table.Td>{order.direction}</Table.Td>
      <Table.Td>{order.type}</Table.Td>
      <Table.Td>{order.price}</Table.Td>
      <Table.Td>{order.shares}</Table.Td>
      <Table.Td>
        <ActionIcon
          onClick={() => {
            void deleteOrder(order.id);
          }}
          c="red"
          variant="subtle"
        >
          <TbTrash />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div>
      <Title order={4}>Active Orders</Title>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Direction</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Price</Table.Th>
            <Table.Th>Shares</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </div>
  );
}

export default Orders;
